import os
import httpx
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import TokenData, User, UserCreate
from database import engine
from sqlalchemy import text
import msal

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Google OAuth Configuration - using existing env var names
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")
MICROSOFT_TENANT_ID = os.getenv("MICROSOFT_TENANT_ID", "common")

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> TokenData:
    """Verify JWT token and return token data"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        
        if email is None or user_id is None or role is None:
            raise credentials_exception
        
        token_data = TokenData(email=email, user_id=user_id, role=role)
        return token_data
    except JWTError:
        raise credentials_exception

async def verify_google_token(id_token: str) -> dict:
    """Verify Google ID token and return user info"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    try:
        # Verify the token with Google
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            )
            response.raise_for_status()
            token_info = response.json()
            
            # Verify the token is for our app
            if token_info.get("aud") != GOOGLE_CLIENT_ID:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token audience"
                )
            
            return {
                "email": token_info.get("email"),
                "name": token_info.get("name"),
                "picture": token_info.get("picture"),
                "email_verified": token_info.get("email_verified", False)
            }
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )

async def verify_microsoft_token(access_token: str, id_token: str) -> dict:
    """Verify Microsoft access token and ID token and return user info"""
    if not MICROSOFT_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Microsoft OAuth not configured"
        )
    
    try:
        print(f"🔐 Verifying Microsoft token for client ID: {MICROSOFT_CLIENT_ID}")
        
        # Verify the access token with Microsoft Graph API
        async with httpx.AsyncClient() as client:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            print("🔐 Making request to Microsoft Graph API...")
            
            # Get user info from Microsoft Graph
            response = await client.get(
                'https://graph.microsoft.com/v1.0/me',
                headers=headers
            )
            
            print(f"🔐 Microsoft Graph response status: {response.status_code}")
            
            if not response.is_success:
                print(f"🔐 Microsoft Graph error response: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Microsoft Graph API error: {response.status_code}"
                )
            
            response.raise_for_status()
            user_info = response.json()
            
            print(f"🔐 Microsoft user info: {user_info}")
            
            # For now, we'll trust the access token verification
            # In production, you should properly verify the ID token
            
            email = user_info.get("mail") or user_info.get("userPrincipalName")
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email not found in Microsoft user info"
                )
            
            return {
                "email": email,
                "name": user_info.get("displayName", "Unknown User"),
                "picture": None,  # Microsoft Graph doesn't provide profile picture in basic endpoint
                "email_verified": True  # Assume verified for Microsoft accounts
            }
    except httpx.HTTPStatusError as e:
        print(f"🔐 HTTP error during Microsoft token verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Microsoft token: {str(e)}"
        )
    except Exception as e:
        print(f"🔐 Unexpected error during Microsoft token verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying Microsoft token: {str(e)}"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    """Get current user from JWT token"""
    return verify_token(credentials.credentials)

def require_admin(current_user: TokenData = Depends(get_current_user)):
    """Require admin role for endpoint access"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_or_create_user(user_info: dict) -> User:
    """Get existing user or create new user"""
    email = user_info["email"]
    
    # Check if user exists
    with engine.begin() as conn:
        result = conn.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": email}
        ).fetchone()
        
        if result:
            # Update last login
            conn.execute(
                text("UPDATE users SET last_login = NOW() WHERE email = :email"),
                {"email": email}
            )
            
            return User(
                user_id=result.user_id,
                email=result.email,
                name=result.name,
                role=result.role,
                profile_picture=result.profile_picture,
                created_at=result.created_at,
                last_login=datetime.utcnow()
            )
        else:
            # Determine initial role based on email or domain
            initial_role = determine_initial_role(email)
            
            # Create new user
            result = conn.execute(
                text("""
                    INSERT INTO users (email, name, role, profile_picture, created_at, last_login)
                    VALUES (:email, :name, :role, :picture, NOW(), NOW())
                    RETURNING *
                """),
                {
                    "email": email,
                    "name": user_info["name"],
                    "role": initial_role,
                    "picture": user_info.get("picture")
                }
            ).fetchone()
            
            return User(
                user_id=result.user_id,
                email=result.email,
                name=result.name,
                role=result.role,
                profile_picture=result.profile_picture,
                created_at=result.created_at,
                last_login=result.last_login
            )

def determine_initial_role(email: str) -> str:
    """Determine initial role based on email or domain"""
    # List of admin emails (you can add your email here)
    admin_emails = [
        "chinmaydhamapurkar25@gmail.com",  # Your email
        "admin@realestatecrm.com",
        "chinmay@zero2one.ai"
    ]
    
    # Check if email is in admin list
    if email.lower() in [admin.lower() for admin in admin_emails]:
        return "admin"
    
    # Check if it's the first user (make them admin)
    with engine.begin() as conn:
        user_count = conn.execute(text("SELECT COUNT(*) FROM users")).fetchone()[0]
        if user_count == 0:
            return "admin"  # First user becomes admin
    
    # Default to agent for all other users
    return "agent" 