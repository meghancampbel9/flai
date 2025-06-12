from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import os
import httpx
from typing import Optional, Dict, Any

# Used to get the token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Supabase config from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

jwks_cache: Optional[Dict[str, Any]] = None

async def get_supabase_jwks():
    """
    Fetch the JSON Web Key Set (JWKS) from Supabase.
    Cache the result to avoid fetching it on every request.
    """
    global jwks_cache
    if jwks_cache:
        return jwks_cache
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase URL or Key not configured"
        )
        
    jwks_url = f"{SUPABASE_URL}/auth/v1/jwks"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(jwks_url)
            response.raise_for_status()
            jwks_cache = response.json()
            return jwks_cache
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch Supabase JWKS: {e}"
            )

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Dependency to get the current user from a Supabase JWT.
    This should be used for protected endpoints.
    """
    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT secret is not configured"
        )
        
    try:
        # Decode the token using the secret
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
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