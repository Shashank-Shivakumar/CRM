from fastapi import FastAPI, HTTPException, Depends, Query, Request
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
from datetime import datetime
from database import engine
from auth_utils import (
    verify_google_token, 
    verify_microsoft_token,
    create_access_token, 
    get_or_create_user,
    get_current_user,
    require_admin,
    verify_token,
    security
)
from models import (
    GoogleAuthRequest, MicrosoftAuthRequest, LoginResponse, User, Property, PropertyCreate, PropertyUpdate,
    PropertyAssignment, AgentProfile, AgentProfileCreate, AgentProfileUpdate,
    Lead, LeadCreate, LeadUpdate, EnquiryCreate, Enquiry, TokenData
)

load_dotenv()

app = FastAPI(title="Real Estate CRM API")

# Dynamic CORS middleware - allows all subdomains of z21crm.com and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.z21crm\.com|http://localhost:\d+|https://z21crm\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for existing functionality
class Enquiry(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    property_id: Optional[int] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class BulkDeleteRequest(BaseModel):
    lead_ids: List[int]

class MessageRequest(BaseModel):
    type: str  # 'email' or 'sms'
    recipients: List[int]  # List of lead IDs
    subject: Optional[str] = None  # For emails only
    body: str
    template: Optional[str] = None

class LeadDetail(BaseModel):
    lead_id: int
    customer_name: str
    email: str
    phone: Optional[str] = None
    status: str
    lead_score: Optional[int] = None
    property_interested: Optional[str] = None
    created_date: Optional[str] = None
    lead_comments: Optional[str] = None

class Interaction(BaseModel):
    sessionId: str
    action: str
    timestamp: str
    page: str
    userAgent: str
    element: Optional[str] = None
    propertyId: Optional[str] = None
    propertyLabel: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    referrer: Optional[str] = None

# Authentication endpoints
@app.post("/auth/google", response_model=LoginResponse)
async def google_auth(request: GoogleAuthRequest):
    """Authenticate user with Google OAuth"""
    try:
        # Verify Google token
        user_info = await verify_google_token(request.id_token)
        
        if not user_info.get("email_verified", False):
            raise HTTPException(
                status_code=400,
                detail="Email not verified with Google"
            )
        
        # Check if user exists in database
        with engine.begin() as conn:
            result = conn.execute(
                text("SELECT * FROM users WHERE email = :email"),
                {"email": user_info["email"]}
            ).fetchone()
            
            if not result:
                raise HTTPException(
                    status_code=401, 
                    detail="User not found. Please contact an administrator to create your account."
                )
        
        # Get existing user (don't create new ones)
        user = await get_or_create_user(user_info)
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.user_id, "role": user.role}
        )
        
        return LoginResponse(access_token=access_token, user=user)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Authentication failed")

@app.post("/auth/microsoft", response_model=LoginResponse)
async def microsoft_auth(request: MicrosoftAuthRequest):
    """Authenticate user with Microsoft OAuth"""
    try:
        print(f"🔐 Microsoft auth request received for access token: {request.access_token[:20]}...")
        
        # Verify Microsoft token
        user_info = await verify_microsoft_token(request.access_token, request.id_token)
        print(f"🔐 User info verified: {user_info}")
        
        if not user_info.get("email_verified", False):
            raise HTTPException(
                status_code=400,
                detail="Email not verified with Microsoft"
            )
        
        # Check if user exists in database
        with engine.begin() as conn:
            result = conn.execute(
                text("SELECT * FROM users WHERE email = :email"),
                {"email": user_info["email"]}
            ).fetchone()
            
            if not result:
                print(f"🔐 User not found in database: {user_info['email']}")
                raise HTTPException(
                    status_code=401, 
                    detail="User not found. Please contact an administrator to create your account."
                )
            
            print(f"🔐 User found in database: {result.email}")
        
        # Get existing user (don't create new ones)
        user = await get_or_create_user(user_info)
        print(f"🔐 User object created: {user.email}")
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.user_id, "role": user.role}
        )
        
        print(f"🔐 Microsoft authentication successful for user: {user.email}")
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user
)        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Microsoft authentication error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Microsoft authentication failed: {str(e)}")

@app.get("/auth/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.post("/auth/logout")
async def logout():
    """Logout endpoint (client-side token removal)"""
    return {"message": "Logged out successfully"}

# Admin-only endpoints
@app.get("/admin/users")
async def list_users(current_user = Depends(require_admin)):
    """List all users (admin only)"""
    with engine.begin() as conn:
        result = conn.execute(text("SELECT * FROM users ORDER BY created_at DESC"))
        users = result.fetchall()
        
        return [
            {
                "user_id": user.user_id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "profile_picture": user.profile_picture,
                "created_at": user.created_at,
                "last_login": user.last_login,
                "is_active": user.is_active
            }
            for user in users
        ]

@app.post("/admin/users")
async def create_user(
    user_data: dict,
    current_user = Depends(require_admin)
):
    """Create new user (admin only)"""
    try:
        with engine.begin() as conn:
            # Check if email already exists
            existing_user = conn.execute(
                text("SELECT user_id FROM users WHERE email = :email"),
                {"email": user_data["email"]}
            ).fetchone()
            
            if existing_user:
                raise HTTPException(status_code=400, detail="User with this email already exists")
            
            # Create new user
            result = conn.execute(text("""
                INSERT INTO users (email, name, role, created_at, last_login)
                VALUES (:email, :name, :role, NOW(), NOW())
                RETURNING *
            """), {
                "email": user_data["email"],
                "name": user_data["name"],
                "role": user_data.get("role", "agent")
            })
            
            new_user = result.fetchone()
            
                    # Create agent profile if role is agent
        if user_data.get("role") == "agent":
            try:
                # Generate a unique public_url based on user name
                public_url = f"agent-{new_user.user_id}-{user_data.get('name', '').lower().replace(' ', '-')}"
                
                conn.execute(text("""
                    INSERT INTO agent_profiles (
                        user_id, public_url, phone, specialization, bio, created_at
                    ) VALUES (
                        :user_id, :public_url, :phone, :specialization, :bio, NOW()
                    )
                """), {
                    "user_id": new_user.user_id,
                    "public_url": public_url,
                    "phone": user_data.get("phone", ""),
                    "specialization": user_data.get("specialization", ""),
                    "bio": user_data.get("bio", "")
                })
            except Exception as e:
                # Continue without agent profile if table doesn't exist
                pass
            
            return {
                "message": "User created successfully",
                "user_id": new_user.user_id,
                "email": new_user.email,
                "name": new_user.name,
                "role": new_user.role
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/admin/stats")
async def get_admin_stats(current_user = Depends(require_admin)):
    """Get admin dashboard stats"""
    with engine.begin() as conn:
        # Get total properties
        properties_result = conn.execute(text("SELECT COUNT(*) FROM properties"))
        total_properties = properties_result.fetchone()[0]
        
        # Get total users
        users_result = conn.execute(text("SELECT COUNT(*) FROM users"))
        total_users = users_result.fetchone()[0]
        
        # Get total leads
        leads_result = conn.execute(text("SELECT COUNT(*) FROM leads"))
        total_leads = leads_result.fetchone()[0]
        
        # Get pending properties (created by agents, not yet approved)
        pending_result = conn.execute(text("SELECT COUNT(*) FROM properties WHERE status = 'pending'"))
        pending_properties = pending_result.fetchone()[0]
        
        return {
            "totalProperties": total_properties,
            "totalUsers": total_users,
            "totalLeads": total_leads,
            "pendingProperties": pending_properties
        }

@app.get("/agent/stats")
async def get_agent_stats(current_user = Depends(get_current_user)):
    """Get agent dashboard stats"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    with engine.begin() as conn:
        # Get total properties assigned to this agent
        properties_result = conn.execute(text("""
            SELECT COUNT(*) FROM properties 
            WHERE assigned_agent_id = :agent_id
        """), {"agent_id": current_user.user_id})
        total_properties = properties_result.fetchone()[0]
        
        # Get total leads assigned to this agent
        leads_result = conn.execute(text("""
            SELECT COUNT(*) FROM lead_info 
            WHERE assigned_agent_id = :agent_id
        """), {"agent_id": current_user.user_id})
        total_leads = leads_result.fetchone()[0]
        
        # Get pending leads for this agent
        pending_leads_result = conn.execute(text("""
            SELECT COUNT(*) FROM lead_info 
            WHERE assigned_agent_id = :agent_id AND status = 'new'
        """), {"agent_id": current_user.user_id})
        pending_leads = pending_leads_result.fetchone()[0]
        
        # Calculate conversion rate
        conversion_rate = 0
        if total_leads > 0:
            conversion_rate = round(((total_leads - pending_leads) / total_leads) * 100)
        
        return {
            "totalProperties": total_properties,
            "totalLeads": total_leads,
            "pendingLeads": pending_leads,
            "conversionRate": conversion_rate
        }

@app.put("/admin/users/{user_id}/role")
async def update_user_role(
    user_id: int, 
    role_data: dict,
    current_user = Depends(require_admin)
):
    """Update user role (admin only)"""
    role = role_data.get("role")
    if not role or role not in ["admin", "agent"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    with engine.begin() as conn:
        result = conn.execute(
            text("UPDATE users SET role = :role WHERE user_id = :user_id RETURNING *"),
            {"role": role, "user_id": user_id}
        ).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User role updated successfully"}

# Admin Property Management
@app.get("/admin/properties")
async def admin_list_properties(
    current_user = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000)
):
    """List all properties (admin only)"""
    offset = (page - 1) * page_size
    
    with engine.begin() as conn:
        # Get total count
        count_result = conn.execute(text("SELECT COUNT(*) FROM properties"))
        total_count = count_result.fetchone()[0]
        
        # Get properties with pagination
        result = conn.execute(text("""
            SELECT p.*, u.name as agent_name
            FROM properties p
            LEFT JOIN users u ON p.assigned_agent_id = u.user_id
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
        """), {"limit": page_size, "offset": offset})
        
        properties = []
        for row in result:
            properties.append({
                "property_id": row.property_id,
                "label": row.label,
                "description": row.description,
                "address": row.address,
                "area": row.area,
                "beds": row.beds,
                "baths": row.baths,
                "price": row.price,
                "property_type": row.property_type,
                "status": row.status,
                "assigned_agent_id": row.assigned_agent_id,
                "agent_name": row.agent_name,
                "created_by": row.created_by,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
                "image_url": row.image_url
            })
        
        return {
            "properties": properties,
            "total_count": total_count,
            "page": page,
            "page_size": page_size
        }

@app.post("/admin/properties")
async def admin_create_property(
    property_data: PropertyCreate,
    current_user = Depends(require_admin)
):
    """Create new property (admin only)"""
    with engine.begin() as conn:
        result = conn.execute(text("""
            INSERT INTO properties (
                label, description, address, area, beds, baths, 
                price, property_type, image_url, created_by, status
            ) VALUES (
                :label, :description, :address, :area, :beds, :baths,
                :price, :property_type, :image_url, :created_by, 'active'
            ) RETURNING *
        """), {
            "label": property_data.label,
            "description": property_data.description,
            "address": property_data.address,
            "area": property_data.area,
            "beds": property_data.beds,
            "baths": property_data.baths,
            "price": property_data.price,
            "property_type": property_data.property_type,
            "image_url": property_data.image_url,
            "created_by": current_user.user_id
        })
        
        new_property = result.fetchone()
        return {
            "message": "Property created successfully",
            "property_id": new_property.property_id
        }

@app.put("/admin/properties/{property_id}")
async def admin_update_property(
    property_id: int,
    property_data: PropertyUpdate,
    current_user = Depends(require_admin)
):
    """Update property (admin only)"""
    with engine.begin() as conn:
        # Build dynamic update query
        update_fields = []
        params = {"property_id": property_id}
        
        for field, value in property_data.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = NOW()")
        
        query = f"""
            UPDATE properties 
            SET {', '.join(update_fields)}
            WHERE property_id = :property_id
            RETURNING *
        """
        
        result = conn.execute(text(query), params)
        updated_property = result.fetchone()
        
        if not updated_property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        return {"message": "Property updated successfully"}

@app.post("/admin/properties/{property_id}/assign")
async def admin_assign_property(
    property_id: int,
    assignment: dict,
    current_user = Depends(require_admin)
):
    """Assign property to agent (admin only)"""
    try:
        agent_id = assignment.get("agent_id")
        if not agent_id:
            raise HTTPException(status_code=400, detail="agent_id is required")
        
        with engine.begin() as conn:
            # Verify property exists
            prop_result = conn.execute(
                text("SELECT property_id FROM properties WHERE property_id = :property_id"),
                {"property_id": property_id}
            )
            if not prop_result.fetchone():
                raise HTTPException(status_code=404, detail="Property not found")
            
            # Verify agent exists
            agent_result = conn.execute(
                text("SELECT user_id FROM users WHERE user_id = :user_id AND role = 'agent'"),
                {"user_id": agent_id}
            )
            if not agent_result.fetchone():
                raise HTTPException(status_code=404, detail="Agent not found")
            
            # Update property assignment
            conn.execute(text("""
                UPDATE properties 
                SET assigned_agent_id = :agent_id, updated_at = NOW()
                WHERE property_id = :property_id
            """), {
                "agent_id": agent_id,
                "property_id": property_id
            })
            
            return {"message": "Property assigned successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Agent Property Management
@app.get("/agent/properties")
async def agent_list_properties(
    current_user = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    """List properties assigned to current agent"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    offset = (page - 1) * page_size
    
    with engine.begin() as conn:
        # Get total count for this agent
        count_result = conn.execute(text("""
            SELECT COUNT(*) FROM properties 
            WHERE assigned_agent_id = :agent_id
        """), {"agent_id": current_user.user_id})
        total_count = count_result.fetchone()[0]
        
        # Get properties assigned to this agent
        result = conn.execute(text("""
            SELECT * FROM properties 
            WHERE assigned_agent_id = :agent_id
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """), {
            "agent_id": current_user.user_id,
            "limit": page_size,
            "offset": offset
        })
        
        properties = []
        for row in result:
            properties.append({
                "property_id": row.property_id,
                "label": row.label,
                "description": row.description,
                "address": row.address,
                "area": row.area,
                "beds": row.beds,
                "baths": row.baths,
                "price": row.price,
                "property_type": row.property_type,
                "status": row.status,
                "created_at": row.created_at,
                "updated_at": row.updated_at
            })
        
        return {
            "properties": properties,
            "total_count": total_count,
            "page": page,
            "page_size": page_size
        }

@app.post("/agent/properties")
async def agent_create_property(
    property_data: PropertyCreate,
    current_user = Depends(get_current_user)
):
    """Create new property (agent only - pending admin approval)"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    with engine.begin() as conn:
        result = conn.execute(text("""
            INSERT INTO properties (
                label, description, address, area, beds, baths, 
                price, property_type, created_by, status, assigned_agent_id
            ) VALUES (
                :label, :description, :address, :area, :beds, :baths,
                :price, :property_type, :created_by, 'pending', :agent_id
            ) RETURNING *
        """), {
            "label": property_data.label,
            "description": property_data.description,
            "address": property_data.address,
            "area": property_data.area,
            "beds": property_data.beds,
            "baths": property_data.baths,
            "price": property_data.price,
            "property_type": property_data.property_type,
            "created_by": current_user.user_id,
            "agent_id": current_user.user_id
        })
        
        new_property = result.fetchone()
        return {
            "message": "Property created successfully and pending admin approval",
            "property_id": new_property.property_id
        }

@app.put("/agent/properties/{property_id}")
async def agent_update_property(
    property_id: int,
    property_data: PropertyUpdate,
    current_user = Depends(get_current_user)
):
    """Update property (agent only - can only update assigned properties)"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    with engine.begin() as conn:
        # Verify property is assigned to this agent
        prop_result = conn.execute(text("""
            SELECT property_id FROM properties 
            WHERE property_id = :property_id AND assigned_agent_id = :agent_id
        """), {
            "property_id": property_id,
            "agent_id": current_user.user_id
        })
        
        if not prop_result.fetchone():
            raise HTTPException(status_code=404, detail="Property not found or not assigned to you")
        
        # Build dynamic update query
        update_fields = []
        params = {"property_id": property_id}
        
        for field, value in property_data.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = NOW()")
        
        query = f"""
            UPDATE properties 
            SET {', '.join(update_fields)}
            WHERE property_id = :property_id AND assigned_agent_id = :agent_id
            RETURNING *
        """
        params["agent_id"] = current_user.user_id
        
        result = conn.execute(text(query), params)
        updated_property = result.fetchone()
        
        if not updated_property:
            raise HTTPException(status_code=404, detail="Property not found")
        
        return {"message": "Property updated successfully"}

# Agent Profile Management
@app.get("/agent/profile")
async def get_agent_profile(current_user = Depends(get_current_user)):
    """Get current agent's profile"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    with engine.begin() as conn:
        result = conn.execute(text("""
            SELECT * FROM agent_profiles 
            WHERE user_id = :user_id
        """), {"user_id": current_user.user_id})
        
        profile = result.fetchone()
        if not profile:
            return {"message": "No profile found", "profile": None}
        
        return {
            "profile_id": profile.profile_id,
            "user_id": profile.user_id,
            "public_url": profile.public_url,
            "bio": profile.bio,
            "phone": profile.phone,
            "profile_picture": profile.profile_picture,
            "is_active": profile.is_active,
            "created_at": profile.created_at,
            "updated_at": profile.updated_at
        }

@app.post("/agent/profile")
async def create_agent_profile(
    profile_data: AgentProfileCreate,
    current_user = Depends(get_current_user)
):
    """Create agent profile"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    with engine.begin() as conn:
        # Check if profile already exists
        existing = conn.execute(text("""
            SELECT profile_id FROM agent_profiles 
            WHERE user_id = :user_id
        """), {"user_id": current_user.user_id})
        
        if existing.fetchone():
            raise HTTPException(status_code=400, detail="Profile already exists")
        
        # Check if public_url is unique
        url_check = conn.execute(text("""
            SELECT profile_id FROM agent_profiles 
            WHERE public_url = :public_url
        """), {"public_url": profile_data.public_url})
        
        if url_check.fetchone():
            raise HTTPException(status_code=400, detail="Public URL already taken")
        
        # Create profile
        result = conn.execute(text("""
            INSERT INTO agent_profiles (
                user_id, public_url, bio, phone, profile_picture
            ) VALUES (
                :user_id, :public_url, :bio, :phone, :profile_picture
            ) RETURNING *
        """), {
            "user_id": current_user.user_id,
            "public_url": profile_data.public_url,
            "bio": profile_data.bio,
            "phone": profile_data.phone,
            "profile_picture": profile_data.profile_picture
        })
        
        new_profile = result.fetchone()
        return {
            "message": "Profile created successfully",
            "profile_id": new_profile.profile_id
        }

@app.put("/agent/profile")
async def update_agent_profile(
    profile_data: AgentProfileUpdate,
    current_user = Depends(get_current_user)
):
    """Update agent profile"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    with engine.begin() as conn:
        # Build dynamic update query
        update_fields = []
        params = {"user_id": current_user.user_id}
        
        for field, value in profile_data.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = NOW()")
        
        query = f"""
            UPDATE agent_profiles 
            SET {', '.join(update_fields)}
            WHERE user_id = :user_id
            RETURNING *
        """
        
        result = conn.execute(text(query), params)
        updated_profile = result.fetchone()
        
        if not updated_profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return {"message": "Profile updated successfully"}

# Public Agent Pages
@app.get("/agent/{public_url}")
async def get_agent_public_page(public_url: str):
    """Get agent's public page with their properties"""
    with engine.begin() as conn:
        # Get agent profile
        profile_result = conn.execute(text("""
            SELECT ap.*, u.name, u.email
            FROM agent_profiles ap
            JOIN users u ON ap.user_id = u.user_id
            WHERE ap.public_url = :public_url AND ap.is_active = TRUE
        """), {"public_url": public_url})
        
        profile = profile_result.fetchone()
        if not profile:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Get agent's properties
        properties_result = conn.execute(text("""
            SELECT * FROM properties 
            WHERE assigned_agent_id = :agent_id AND status = 'active'
            ORDER BY created_at DESC
        """), {"agent_id": profile.user_id})
        
        properties = []
        for row in properties_result:
            properties.append({
                "property_id": row.property_id,
                "label": row.label,
                "description": row.description,
                "address": row.address,
                "area": row.area,
                "beds": row.beds,
                "baths": row.baths,
                "price": row.price,
                "property_type": row.property_type
            })
        
        return {
            "agent": {
                "name": profile.name,
                "email": profile.email,
                "bio": profile.bio,
                "phone": profile.phone,
                "profile_picture": profile.profile_picture,
                "public_url": profile.public_url
            },
            "properties": properties
        }

# Lead Management
@app.get("/agent/leads")
async def agent_list_leads(
    current_user = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    """List leads assigned to current agent"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    offset = (page - 1) * page_size
    
    with engine.begin() as conn:
        # Get total count for this agent
        count_result = conn.execute(text("""
            SELECT COUNT(*) FROM leads 
            WHERE assigned_agent_id = :agent_id
        """), {"agent_id": current_user.user_id})
        total_count = count_result.fetchone()[0]
        
        # Get leads assigned to this agent
        result = conn.execute(text("""
            SELECT l.*, p.label as property_label
            FROM leads l
            LEFT JOIN properties p ON l.property_id = p.property_id
            WHERE l.assigned_agent_id = :agent_id
            ORDER BY l.created_at DESC
            LIMIT :limit OFFSET :offset
        """), {
            "agent_id": current_user.user_id,
            "limit": page_size,
            "offset": offset
        })
        
        leads = []
        for row in result:
            leads.append({
                "lead_id": row.lead_id,
                "name": row.name,
                "email": row.email,
                "phone": row.phone,
                "message": row.message,
                "property_id": row.property_id,
                "property_label": row.property_label,
                "status": row.status,
                "source": row.source,
                "created_at": row.created_at
            })
        
        return {
            "leads": leads,
            "total_count": total_count,
            "page": page,
            "page_size": page_size
        }

@app.post("/agent/leads")
async def agent_create_lead(
    lead_data: LeadCreate,
    current_user = Depends(get_current_user)
):
    """Create new lead (agent only)"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    
    with engine.begin() as conn:
        result = conn.execute(text("""
            INSERT INTO leads (
                name, email, phone, message, property_id, 
                assigned_agent_id, created_by, source
            ) VALUES (
                :name, :email, :phone, :message, :property_id,
                :agent_id, :agent_id, 'agent_created'
            ) RETURNING *
        """), {
            "name": lead_data.name,
            "email": lead_data.email,
            "phone": lead_data.phone,
            "message": lead_data.message,
            "property_id": lead_data.property_id,
            "agent_id": current_user.user_id
        })
        
        new_lead = result.fetchone()
        return {
            "message": "Lead created successfully",
            "lead_id": new_lead.lead_id
        }

# Create interaction tracking table
def create_interaction_table():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_interactions (
                interaction_id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                element_id VARCHAR(100),
                page_url VARCHAR(500),
                property_id VARCHAR(50),
                property_label VARCHAR(255),
                phone VARCHAR(50),
                email VARCHAR(255),
                referrer VARCHAR(500),
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                engagement_score INTEGER DEFAULT 0
            )
        """))

# Initialize tables
create_interaction_table()

# Lead scoring function
def calculate_lead_score(lead_data, interactions=None):
    score = 0
    score += 10  # Base score
    
    # Original factors
    if lead_data.get('lead_comments'):
        message_length = len(lead_data['lead_comments'])
        if message_length > 100: score += 20
        elif message_length > 50: score += 15
        elif message_length > 20: score += 10
        else: score += 5
    
    email = lead_data.get('user_id', '')
    if email:
        domain = email.split('@')[-1].lower()
        if domain in ['gmail.com', 'yahoo.com', 'hotmail.com']: score += 5
        else: score += 15  # Business email
    
    customer_name = lead_data.get('customer_name', '')
    if customer_name and len(customer_name.split()) >= 2: score += 10
    
    if lead_data.get('created_date'): score += 5
    
    # New interaction-based scoring
    if interactions:
        for interaction in interactions:
            if interaction['action_type'] == 'property_view':
                score += 15
            elif interaction['action_type'] == 'property_detail_view':
                score += 20
            elif interaction['action_type'] == 'contact_click':
                score += 25
            elif interaction['action_type'] == 'enquiry_form_open':
                score += 10
            elif interaction['action_type'] == 'enquiry_submitted':
                score += 30
            elif interaction['action_type'] == 'phone_click':
                score += 20
            elif interaction['action_type'] == 'email_click':
                score += 15
            elif interaction['action_type'] == 'page_view':
                score += 2
    
    return min(score, 100)

# API endpoints
@app.get("/")
async def root():
    return {"message": "Real Estate CRM API"}

def get_optional_user(request: Request) -> Optional[TokenData]:
    """Get current user if Authorization header is present"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    try:
        token = auth_header.split(" ")[1]
        return verify_token(token)
    except:
        return None

@app.get("/properties")
async def list_properties(request: Request, current_user: Optional[TokenData] = Depends(get_optional_user)):
    """List properties - filtered by agent if logged in as agent"""
    with engine.connect() as conn:
        if current_user and current_user.role == "agent":
            # For agents, only show their assigned properties
            result = conn.execute(text("""
                SELECT p.*, u.name as agent_name
                FROM properties p
                LEFT JOIN users u ON p.assigned_agent_id = u.user_id
                WHERE p.assigned_agent_id = :agent_id
                ORDER BY p.created_at DESC
            """), {"agent_id": current_user.user_id})
        else:
            # For public users and admins, show all properties
            result = conn.execute(text("""
                SELECT p.*, u.name as agent_name
                FROM properties p
                LEFT JOIN users u ON p.assigned_agent_id = u.user_id
                ORDER BY p.created_at DESC
            """))
        
        properties = []
        for row in result:
            properties.append({
                "property_id": row.property_id,
                "label": row.label,
                "description": row.description,
                "address": row.address,
                "area": row.area,
                "beds": row.beds,
                "baths": row.baths,
                "price": row.price,
                "property_type": row.property_type,
                "status": row.status,
                "assigned_agent_id": row.assigned_agent_id,
                "agent_name": row.agent_name,
                "created_by": row.created_by,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
                "image_url": row.image_url
            })
        return properties

@app.get("/properties/{property_id}")
async def get_property(property_id: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT p.*, u.name as agent_name
            FROM properties p
            LEFT JOIN users u ON p.assigned_agent_id = u.user_id
            WHERE p.property_id = :property_id
        """), {"property_id": property_id})
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Property not found")
        
        return {
            "property_id": row.property_id,
            "label": row.label,
            "description": row.description,
            "address": row.address,
            "area": row.area,
            "beds": row.beds,
            "baths": row.baths,
            "price": row.price,
            "property_type": row.property_type,
            "status": row.status,
            "assigned_agent_id": row.assigned_agent_id,
            "agent_name": row.agent_name,
            "created_by": row.created_by,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "image_url": row.image_url
        }

@app.post("/enquiry")
async def create_enquiry(enquiry: Enquiry, request: Request):
    # Get current user if logged in
    current_user = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            current_user = verify_token(token)
        except:
            pass
    with engine.begin() as conn:
        # Insert or update user_basic_info
        upsert_user = text("""
            INSERT INTO user_basic_info (email_id, first_name, last_name, display_name)
            VALUES (:email, :first_name, :last_name, :display_name)
            ON CONFLICT (email_id) 
            DO UPDATE SET 
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                display_name = EXCLUDED.display_name
        """)
        
        # Split name into first and last name
        name_parts = enquiry.name.split(' ', 1)
        first_name = name_parts[0] if name_parts else enquiry.name
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        conn.execute(upsert_user, {
            "email": enquiry.email,
            "first_name": first_name,
            "last_name": last_name,
            "display_name": enquiry.name
        })

        # Insert into lead_info
        insert_lead = text("""
            INSERT INTO lead_info (user_id, price, status, category, sub_category, lead_scode, lead_comments)
            VALUES (:email, NULL, 'new', NULL, NULL, NULL, :message)
            RETURNING lead_id
        """)
        result = conn.execute(insert_lead, {
            "email": enquiry.email,
            "message": enquiry.message
        })
        lead_id = result.fetchone()[0]

        # Get property label if property_id is provided
        property_label = "General Inquiry"
        if enquiry.property_id:
            prop_result = conn.execute(
                text("SELECT label FROM property_info WHERE property_id = :property_id"),
                {"property_id": enquiry.property_id}
            )
            prop_row = prop_result.fetchone()
            if prop_row:
                property_label = prop_row.label

        # Insert into lead_additional_info
        insert_additional = text("""
            INSERT INTO lead_additional_info (lead_id, created_by, created_date, created_time, source)
            VALUES (:lead_id, :email, CURRENT_DATE, CURRENT_TIME, 'website')
        """)
        conn.execute(insert_additional, {"lead_id": lead_id, "email": enquiry.email})

        # Update lead_info with property_interested and agent assignment
        if current_user and current_user.role == "agent":
            # Check if user already exists
            existing_user = conn.execute(
                text("SELECT user_id FROM users WHERE email = :email"),
                {"email": enquiry.email}
            ).fetchone()
            
            if not existing_user:
                # Create new user entry
                user_result = conn.execute(text("""
                    INSERT INTO users (email, name, role, created_at, last_login)
                    VALUES (:email, :name, 'customer', NOW(), NOW())
                    RETURNING user_id
                """), {
                    "email": enquiry.email,
                    "name": enquiry.name
                })
                user_id = user_result.fetchone()[0]
            else:
                user_id = existing_user.user_id
            
            # Assign to current agent in users table
            conn.execute(text("""
                UPDATE users 
                SET assigned_agent_id = :agent_id 
                WHERE user_id = :user_id
            """), {
                "agent_id": current_user.user_id,
                "user_id": user_id
            })
            
            # Also assign the lead to the agent in lead_info table
            update_lead = text("""
                UPDATE lead_info 
                SET property_interested = :property_label, assigned_agent_id = :agent_id
                WHERE lead_id = :lead_id
            """)
            conn.execute(update_lead, {
                "lead_id": lead_id, 
                "property_label": property_label,
                "agent_id": current_user.user_id
            })
        else:
            # For public enquiries, just update property_interested
            update_lead = text("""
                UPDATE lead_info 
                SET property_interested = :property_label
                WHERE lead_id = :lead_id
            """)
            conn.execute(update_lead, {"lead_id": lead_id, "property_label": property_label})

    return {"message": "Enquiry submitted successfully", "lead_id": lead_id}

@app.get("/leads")
async def list_leads(request: Request):
    # Get current user if logged in
    current_user = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            current_user = verify_token(token)
        except:
            pass
    with engine.connect() as conn:
        # Build query based on user role
        if current_user and current_user.role == "agent":
            # For agents, only show leads assigned to them
            query = text("""
                SELECT 
                    l.lead_id,
                    u.display_name as customer_name,
                    l.user_id as email,
                    l.status,
                    l.lead_comments,
                    l.created_date,
                    l.property_interested,
                    l.lead_score
                FROM lead_info l
                LEFT JOIN user_basic_info u ON l.user_id = u.email_id
                WHERE l.assigned_agent_id = :agent_id
                ORDER BY l.created_date DESC
            """)
            result = conn.execute(query, {"agent_id": current_user.user_id})
        else:
            # For admins and public, show all leads
            result = conn.execute(text("""
                SELECT 
                    l.lead_id,
                    u.display_name as customer_name,
                    l.user_id as email,
                    l.status,
                    l.lead_comments,
                    l.created_date,
                    l.property_interested,
                    l.lead_score
                FROM lead_info l
                LEFT JOIN user_basic_info u ON l.user_id = u.email_id
                ORDER BY l.created_date DESC
            """))
        
        leads = []
        for row in result:
            # Get interactions for this lead
            interactions_result = conn.execute(text("""
                SELECT action_type, COUNT(*) as count
                FROM user_interactions 
                WHERE email = :email
                GROUP BY action_type
            """), {"email": row.email})
            
            interactions = [{"action_type": r.action_type, "count": r.count} for r in interactions_result]
            
            # Calculate lead score
            lead_data = {
                "lead_comments": row.lead_comments,
                "user_id": row.email,
                "customer_name": row.customer_name,
                "created_date": row.created_date
            }
            
            lead_score = calculate_lead_score(lead_data, interactions)
            
            # Update lead score in database
            conn.execute(text("""
                UPDATE lead_info 
                SET lead_score = :score 
                WHERE lead_id = :lead_id
            """), {"score": lead_score, "lead_id": row.lead_id})
            
            leads.append({
                "lead_id": row.lead_id,
                "customer_name": row.customer_name,
                "email": row.email,
                "phone": None,  # Phone not available in current schema
                "status": row.status,
                "lead_score": lead_score,
                "property_interested": row.property_interested,
                "created_date": row.created_date,
                "lead_comments": row.lead_comments
            })
        
        return leads

@app.get("/leads/{lead_id}")
async def get_lead_detail(lead_id: int):
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT 
                l.lead_id,
                u.display_name as customer_name,
                l.user_id as email,
                l.status,
                l.lead_comments,
                l.created_date,
                l.property_interested,
                l.lead_score
            FROM lead_info l
            LEFT JOIN user_basic_info u ON l.user_id = u.email_id
            WHERE l.lead_id = :lead_id
        """), {"lead_id": lead_id})
        
        row = result.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return {
            "lead_id": row.lead_id,
            "customer_name": row.customer_name,
            "email": row.email,
            "phone": None,  # Phone not available in current schema
            "status": row.status,
            "lead_score": row.lead_score,
            "property_interested": row.property_interested,
            "created_date": row.created_date,
            "lead_comments": row.lead_comments
        }

@app.put("/leads/{lead_id}/status")
async def update_lead_status(lead_id: int, update: LeadUpdate):
    with engine.connect() as conn:
        update_query = text("""
            UPDATE lead_info 
            SET status = COALESCE(:status, status)
            WHERE lead_id = :lead_id
        """)
        conn.execute(update_query, {"lead_id": lead_id, "status": update.status})
        
        if update.notes:
            # Add notes to lead_additional_info
            insert_notes = text("""
                INSERT INTO lead_additional_info (lead_id, created_by, created_date, created_time, source)
                VALUES (:lead_id, 'system', CURRENT_DATE, CURRENT_TIME, 'notes')
            """)
            conn.execute(insert_notes, {"lead_id": lead_id})
        
        conn.commit()
    
    return {"message": "Lead status updated successfully"}

@app.get("/leads/stats/summary")
async def get_lead_stats():
    with engine.connect() as conn:
        # Total leads
        total_result = conn.execute(text("SELECT COUNT(*) as total FROM lead_info"))
        total_leads = total_result.fetchone().total
        
        # Status breakdown
        status_result = conn.execute(text("""
            SELECT status, COUNT(*) as count 
            FROM lead_info 
            GROUP BY status
        """))
        status_breakdown = {row.status: row.count for row in status_result}
        
        # Average lead score
        score_result = conn.execute(text("""
            SELECT AVG(lead_score) as avg_score 
            FROM lead_info 
            WHERE lead_score IS NOT NULL
        """))
        avg_score_row = score_result.fetchone()
        avg_score = round(avg_score_row.avg_score, 1) if avg_score_row.avg_score else 0
        
        return {
            "total_leads": total_leads,
            "status_breakdown": status_breakdown,
            "average_lead_score": avg_score
        }

@app.post("/track-interaction")
async def track_interaction(interaction: Interaction):
    with engine.connect() as conn:
        # Calculate engagement score based on action
        engagement_score = 0
        if interaction.action == "property_view":
            engagement_score = 15
        elif interaction.action == "property_detail_view":
            engagement_score = 20
        elif interaction.action == "contact_click":
            engagement_score = 25
        elif interaction.action == "enquiry_form_open":
            engagement_score = 10
        elif interaction.action == "enquiry_submitted":
            engagement_score = 30
        elif interaction.action == "phone_click":
            engagement_score = 20
        elif interaction.action == "email_click":
            engagement_score = 15
        elif interaction.action == "page_view":
            engagement_score = 2
        
        # Insert interaction
        insert_query = text("""
            INSERT INTO user_interactions (
                session_id, action_type, element_id, page_url, property_id, 
                property_label, phone, email, referrer, user_agent, engagement_score
            ) VALUES (
                :session_id, :action_type, :element_id, :page_url, :property_id,
                :property_label, :phone, :email, :referrer, :user_agent, :engagement_score
            )
        """)
        
        conn.execute(insert_query, {
            "session_id": interaction.sessionId,
            "action_type": interaction.action,
            "element_id": interaction.element,
            "page_url": interaction.page,
            "property_id": interaction.propertyId,
            "property_label": interaction.propertyLabel,
            "phone": interaction.phone,
            "email": interaction.email,
            "referrer": interaction.referrer,
            "user_agent": interaction.userAgent,
            "engagement_score": engagement_score
        })
        
        conn.commit()
        
        # If we have an email, update lead score
        if interaction.email:
            # Get all interactions for this email
            interactions_result = conn.execute(text("""
                SELECT action_type, COUNT(*) as count
                FROM user_interactions 
                WHERE email = :email
                GROUP BY action_type
            """), {"email": interaction.email})
            
            interactions = [{"action_type": r.action_type, "count": r.count} for r in interactions_result]
            
            # Get lead data
            lead_result = conn.execute(text("""
                SELECT l.lead_comments, l.user_id, u.display_name as customer_name, l.created_date
                FROM lead_info l
                LEFT JOIN user_basic_info u ON l.user_id = u.email_id
                WHERE l.user_id = :email
                ORDER BY l.created_date DESC
                LIMIT 1
            """), {"email": interaction.email})
            
            lead_row = lead_result.fetchone()
            if lead_row:
                lead_data = {
                    "lead_comments": lead_row.lead_comments,
                    "user_id": lead_row.user_id,
                    "customer_name": lead_row.customer_name,
                    "created_date": lead_row.created_date
                }
                
                new_score = calculate_lead_score(lead_data, interactions)
                
                # Update lead score
                conn.execute(text("""
                    UPDATE lead_info 
                    SET lead_score = :score 
                    WHERE user_id = :email
                """), {"score": new_score, "email": interaction.email})
                
                conn.commit()
                
                return {
                    "message": "Interaction tracked successfully",
                    "leadScore": new_score,
                    "engagementScore": engagement_score
                }
        
        return {
            "message": "Interaction tracked successfully",
            "engagementScore": engagement_score
        }

@app.delete("/leads/bulk-delete")
async def bulk_delete_leads(request: BulkDeleteRequest):
    try:
        with engine.begin() as conn:
            # Delete from lead_additional_info first (due to foreign key constraint)
            delete_additional = text("""
                DELETE FROM lead_additional_info 
                WHERE lead_id = ANY(:lead_ids)
            """)
            conn.execute(delete_additional, {"lead_ids": request.lead_ids})
            
            # Delete from lead_info
            delete_leads = text("""
                DELETE FROM lead_info 
                WHERE lead_id = ANY(:lead_ids)
            """)
            result = conn.execute(delete_leads, {"lead_ids": request.lead_ids})
            
            deleted_count = result.rowcount
            
        return {
            "message": f"Successfully deleted {deleted_count} leads",
            "deleted_count": deleted_count,
            "deleted_ids": request.lead_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting leads: {str(e)}")

@app.post("/leads/send-message")
async def send_message(request: MessageRequest):
    try:
        with engine.connect() as conn:
            # Get recipient details
            recipients_query = text("""
                SELECT lead_id, customer_name, email, phone, status
                FROM lead_info 
                WHERE lead_id = ANY(:lead_ids)
            """)
            
            result = conn.execute(recipients_query, {"lead_ids": request.recipients})
            recipients = [dict(row) for row in result]
            
            if not recipients:
                raise HTTPException(status_code=400, detail="No valid recipients found")
            
            # For now, we'll simulate sending messages
            # In a real implementation, you would integrate with:
            # - Email service (SendGrid, AWS SES, etc.)
            # - SMS service (Twilio, AWS SNS, etc.)
            
            sent_messages = []
            failed_messages = []
            
            for recipient in recipients:
                try:
                    # Personalize message
                    personalized_body = request.body.replace("{{name}}", recipient.get('customer_name', 'there'))
                    personalized_subject = request.subject.replace("{{name}}", recipient.get('customer_name', 'there')) if request.subject else None
                    
                    # Simulate sending
                    message_data = {
                        "recipient_id": recipient['lead_id'],
                        "recipient_name": recipient['customer_name'],
                        "type": request.type,
                        "to": recipient['email'] if request.type == 'email' else recipient['phone'],
                        "subject": personalized_subject,
                        "body": personalized_body,
                        "template": request.template,
                        "status": "sent",  # In real implementation, this would be updated based on actual delivery status
                        "sent_at": datetime.now().isoformat()
                    }
                    
                    sent_messages.append(message_data)
                    
                    # Log the message (in real implementation, you'd store this in a messages table)
                    print(f"Sending {request.type} to {recipient['customer_name']}: {message_data}")
                    
                except Exception as e:
                    failed_messages.append({
                        "recipient_id": recipient['lead_id'],
                        "recipient_name": recipient['customer_name'],
                        "error": str(e)
                    })
            
            return {
                "message": f"Message sending completed",
                "sent_count": len(sent_messages),
                "failed_count": len(failed_messages),
                "sent_messages": sent_messages,
                "failed_messages": failed_messages
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending messages: {str(e)}")

@app.get("/test-microsoft-auth")
async def test_microsoft_auth():
    """Test endpoint to verify Microsoft authentication setup"""
    return {
        "message": "Microsoft authentication test endpoint",
        "client_id": os.getenv("MICROSOFT_CLIENT_ID"),
        "tenant_id": os.getenv("MICROSOFT_TENANT_ID"),
        "status": "Backend is running and configured"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 