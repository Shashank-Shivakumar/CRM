import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

# Database connection with existing environment variable names
POSTGRES_USER = os.getenv('CLOUD_POSTGRES_USER', 'postgres')
POSTGRES_PASSWORD = os.getenv('CLOUD_POSTGRES_PASSWORD', '')
POSTGRES_HOST = os.getenv('CLOUD_POSTGRES_HOST', 'localhost')
POSTGRES_PORT = os.getenv('CLOUD_POSTGRES_PORT', '5432')
POSTGRES_DB = os.getenv('CLOUD_POSTGRES_DB', 'real_estate_crm')

# Create DATABASE_URL with proper formatting
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

print(f"Connecting to database: {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")

engine = create_engine(DATABASE_URL)

def create_users_table():
    """Create users table for authentication"""
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'agent',
                profile_picture TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        """))

def create_agent_profiles_table():
    """Create agent profiles table for public agent pages"""
    with engine.begin() as conn:
        # Check if table already exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'agent_profiles'
            )
        """)).fetchone()
        
        if not result[0]:
            conn.execute(text("""
                CREATE TABLE agent_profiles (
                    profile_id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                    public_url VARCHAR(255) UNIQUE NOT NULL,
                    bio TEXT,
                    phone VARCHAR(20),
                    profile_picture TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))

def create_enhanced_properties_table():
    """Create enhanced properties table with ownership and assignment"""
    with engine.begin() as conn:
        # First, check if properties table exists and has the new columns
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'properties' AND column_name = 'assigned_agent_id'
        """)).fetchone()
        
        if not result:
            # Add new columns to existing properties table
            conn.execute(text("""
                ALTER TABLE properties 
                ADD COLUMN IF NOT EXISTS assigned_agent_id INTEGER REFERENCES users(user_id),
                ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(user_id),
                ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """))
        
        # Create the enhanced properties table structure
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS properties (
                property_id SERIAL PRIMARY KEY,
                label VARCHAR(255) NOT NULL,
                description TEXT,
                address TEXT,
                area VARCHAR(100),
                beds INTEGER,
                baths INTEGER,
                price DECIMAL(12,2),
                property_type VARCHAR(100),
                status VARCHAR(50) DEFAULT 'active',
                assigned_agent_id INTEGER REFERENCES users(user_id),
                created_by INTEGER REFERENCES users(user_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

def create_property_assignments_table():
    """Create property assignments table for many-to-many relationships"""
    with engine.begin() as conn:
        # Check if table already exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'property_assignments'
            )
        """)).fetchone()
        
        if not result[0]:
            conn.execute(text("""
                CREATE TABLE property_assignments (
                    assignment_id SERIAL PRIMARY KEY,
                    property_id INTEGER REFERENCES properties(property_id) ON DELETE CASCADE,
                    agent_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                    assigned_by INTEGER REFERENCES users(user_id),
                    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'active',
                    UNIQUE(property_id, agent_id)
                )
            """))

def create_leads_table():
    """Create leads table for lead management"""
    with engine.begin() as conn:
        # Check if table already exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'leads'
            )
        """)).fetchone()
        
        if not result[0]:
            conn.execute(text("""
                CREATE TABLE leads (
                    lead_id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    message TEXT,
                    property_id INTEGER REFERENCES properties(property_id),
                    assigned_agent_id INTEGER REFERENCES users(user_id),
                    created_by INTEGER REFERENCES users(user_id),
                    status VARCHAR(50) DEFAULT 'new',
                    source VARCHAR(100) DEFAULT 'website',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))

def create_tables():
    """Create all necessary tables"""
    create_users_table()
    create_agent_profiles_table()
    create_enhanced_properties_table()
    create_property_assignments_table()
    create_leads_table()
    
    # Create other existing tables
    with engine.begin() as conn:
        # Enquiries table (enhanced)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS enquiries (
                enquiry_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                message TEXT,
                property_id INTEGER REFERENCES properties(property_id),
                assigned_agent_id INTEGER REFERENCES users(user_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'new'
            )
        """))
        
        # User interactions table
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
create_tables() 