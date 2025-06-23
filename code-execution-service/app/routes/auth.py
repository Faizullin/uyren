from fastapi import APIRouter, Depends
from typing import Dict, Any

from ..dependencies import require_auth

router = APIRouter()


@router.get("/verify")
async def verify_authentication(user: Dict[str, Any] = Depends(require_auth)):
    """Test endpoint to verify Firebase authentication is working"""
    return {
        "authenticated": True,
        "user": {
            "uid": user.get("uid"),
            "email": user.get("email"),
            "name": user.get("name"),
            "email_verified": user.get("email_verified", False)
        },
        "message": "Firebase authentication successful"
    }


@router.get("/user")
async def get_user_info(user: Dict[str, Any] = Depends(require_auth)):
    """Get detailed user information from Firebase token"""
    return {
        "user_data": user,
        "firebase_claims": user.get("firebase_claims", {})
    }
