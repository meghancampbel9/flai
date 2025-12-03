#!/usr/bin/env python3
"""Script to download an image from a URL (handles Cloudflare-protected sites)."""

import subprocess
from pathlib import Path

def download_image(url: str, output_path: str) -> str:
    """Download an image from a URL and save it locally using wget."""
    
    # Use wget with browser-like headers to bypass Cloudflare protection
    wget_cmd = [
        'wget',
        '--header=Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        '--header=Accept-Language: en-US,en;q=0.9',
        '--header=sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120"',
        '--header=sec-ch-ua-mobile: ?0',
        '--header=sec-ch-ua-platform: "Linux"',
        '--header=Sec-Fetch-Dest: document',
        '--header=Sec-Fetch-Mode: navigate',
        '--header=Sec-Fetch-Site: none',
        '--header=Sec-Fetch-User: ?1',
        '--header=Upgrade-Insecure-Requests: 1',
        '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '-O', output_path,
        url
    ]
    
    result = subprocess.run(wget_cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        raise RuntimeError(f"Failed to download image: {result.stderr}")
    
    print(f"Image downloaded successfully to: {output_path}")
    return output_path


if __name__ == "__main__":
    url = "https://images.vestiairecollective.com/images/resized/w=500,q=75,f=auto,/produit/black-silk-ulla-johnson-top-56134314-1_2.jpg"
    download_image(url, "black-silk-ulla-johnson-top.webp")
