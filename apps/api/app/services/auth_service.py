from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt as pyjwt
import os
import httpx
from typing import Optional, Dict, Any
import asyncio

# Used to get the token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Supabase config from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # Fallback for legacy support

# JWKS cache for modern Supabase JWT validation
jwks_cache: Optional[Dict[str, Any]] = None
jwks_keys_cache: Optional[Dict[str, Any]] = None

async def get_supabase_jwks():
    """
    Fetch the JSON Web Key Set (JWKS) from Supabase.
    Cache the result to avoid fetching it on every request.
    """
    global jwks_cache, jwks_keys_cache
    if jwks_cache and jwks_keys_cache:
        return jwks_keys_cache
    
    if not SUPABASE_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase URL not configured"
        )
        
    jwks_url = f"{SUPABASE_URL}/auth/v1/jwks"
    async with httpx.AsyncClient() as client:
        try:
            # Try without authentication first (JWKS should be public)
            response = await client.get(jwks_url)
            if response.status_code == 401:
                # If unauthorized, try with service role key
                headers = {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
                }
                response = await client.get(jwks_url, headers=headers)
            response.raise_for_status()
            jwks_cache = response.json()
            
            # Convert JWKS to a format that PyJWT can use
            jwks_keys_cache = {}
            for key in jwks_cache.get("keys", []):
                kid = key.get("kid")
                if kid:
                    jwks_keys_cache[kid] = key
            
            return jwks_keys_cache
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch Supabase JWKS: {e}"
            )

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency to get the current user from a Supabase JWT.
    Uses legacy JWT secret validation for now.
    
    TODO: Implement proper JWKS validation when Supabase JWKS endpoint is available.
    Current JWKS endpoint returns 404 Not Found, so falling back to JWT secret.
    """
    try:
        # For development mode - bypass validation
        if token == "dev-token":
            return {
                "sub": "00000000-0000-0000-0000-000000000001",  # Dev mode user_id
                "email": "dev@example.com",
                "phone": "+491799004465",
                "aud": "authenticated",
                "role": "authenticated"
            }
        
        # Use legacy JWT secret validation
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT secret is not configured"
            )
        
        payload = pyjwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
        
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except pyjwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_id(user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """
    Dependency to get the user's ID from the JWT payload.
    """
    user_id = user.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID not found in token"
        )
    return user_id 