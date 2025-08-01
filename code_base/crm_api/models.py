from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Enhanced Property Models
class Property(BaseModel):
    property_id: int
    label: str
    description: Optional[str]
    address: Optional[str]
    area: Optional[str]
    beds: Optional[int]
    baths: Optional[int]
    price: Optional[float]
    property_type: Optional[str]
    status: str = 'active'
    assigned_agent_id: Optional[int]
    created_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

class PropertyCreate(BaseModel):
    label: str
    description: Optional[str]
    address: Optional[str]
    area: Optional[str]
    beds: Optional[int]
    baths: Optional[int]
    price: Optional[float]
    property_type: Optional[str]
    image_url: Optional[str] = None

class PropertyUpdate(BaseModel):
    label: Optional[str]
    description: Optional[str]
    address: Optional[str]
    area: Optional[str]
    beds: Optional[int]
    baths: Optional[int]
    price: Optional[float]
    property_type: Optional[str]
    status: Optional[str]
    image_url: Optional[str] = None

class PropertyAssignment(BaseModel):
    property_id: int
    agent_id: int

# Agent Profile Models
class AgentProfile(BaseModel):
    profile_id: int
    user_id: int
    public_url: str
    bio: Optional[str]
    phone: Optional[str]
    profile_picture: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

class AgentProfileCreate(BaseModel):
    public_url: str
    bio: Optional[str]
    phone: Optional[str]
    profile_picture: Optional[str]

class AgentProfileUpdate(BaseModel):
    bio: Optional[str]
    phone: Optional[str]
    profile_picture: Optional[str]
    is_active: Optional[bool]

# Lead Models
class Lead(BaseModel):
    lead_id: int
    name: str
    email: str
    phone: Optional[str]
    message: Optional[str]
    property_id: Optional[int]
    assigned_agent_id: Optional[int]
    created_by: Optional[int]
    status: str
    source: str
    created_at: datetime
    updated_at: Optional[datetime]

class LeadCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str]
    message: Optional[str]
    property_id: Optional[int]

class LeadUpdate(BaseModel):
    status: Optional[str]
    assigned_agent_id: Optional[int]

# Enhanced Enquiry Models
class EnquiryCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str]
    message: Optional[str]
    property_id: int

class Enquiry(BaseModel):
    enquiry_id: int
    name: str
    email: str
    phone: Optional[str]
    message: Optional[str]
    property_id: int
    assigned_agent_id: Optional[int]
    created_at: datetime
    status: str

# Authentication Models
class User(BaseModel):
    user_id: int
    email: str
    name: str
    role: str  # 'admin' or 'agent'
    profile_picture: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    email: str
    name: str
    role: str = 'agent'
    profile_picture: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    id_token: str

class MicrosoftAuthRequest(BaseModel):
    access_token: str
    id_token: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

# Analytics Models
class PropertyStats(BaseModel):
    property_id: int
    total_views: int
    total_inquiries: int
    conversion_rate: float

class AgentStats(BaseModel):
    agent_id: int
    agent_name: str
    total_properties: int
    total_leads: int
    conversion_rate: float
    total_revenue: float

# Response Models
class PropertyListResponse(BaseModel):
    properties: List[Property]
    total_count: int
    page: int
    page_size: int

class LeadListResponse(BaseModel):
    leads: List[Lead]
    total_count: int
    page: int
    page_size: int 