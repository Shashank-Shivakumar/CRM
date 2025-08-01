#!/usr/bin/env python3
"""
Comprehensive Database Schema Update Script
Updates all tables to their final state for the Real Estate CRM
"""

import os
import sys
from sqlalchemy import text, create_engine
from database import DATABASE_URL

def update_database_schema():
    """Update the database schema to the final state"""
    
    # Get database connection
    engine = create_engine(DATABASE_URL)
    
    print("🔄 Updating database schema...")
    
    with engine.begin() as conn:
        try:
            # 1. Create users table if it doesn't exist
            print("📋 Creating/updating users table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'agent',
                    profile_picture TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    assigned_agent_id INTEGER REFERENCES users(user_id)
                )
            """))
            
            # 2. Create properties table if it doesn't exist
            print("📋 Creating/updating properties table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS properties (
                    property_id SERIAL PRIMARY KEY,
                    label VARCHAR(255) NOT NULL,
                    description TEXT,
                    address TEXT NOT NULL,
                    area INTEGER,
                    beds INTEGER,
                    baths INTEGER,
                    price DECIMAL(12,2),
                    property_type VARCHAR(100),
                    status VARCHAR(50) DEFAULT 'active',
                    assigned_agent_id INTEGER REFERENCES users(user_id),
                    created_by INTEGER REFERENCES users(user_id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    image_url TEXT
                )
            """))
            
            # 3. Create agent_profiles table if it doesn't exist
            print("📋 Creating/updating agent_profiles table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS agent_profiles (
                    profile_id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(user_id) UNIQUE,
                    specialization VARCHAR(255),
                    bio TEXT,
                    public_url VARCHAR(255) NOT NULL DEFAULT 'agent',
                    phone VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # 4. Create lead_info table if it doesn't exist
            print("📋 Creating/updating lead_info table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS lead_info (
                    lead_id SERIAL PRIMARY KEY,
                    customer_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    status VARCHAR(50) DEFAULT 'new',
                    lead_score INTEGER DEFAULT 0,
                    property_interested VARCHAR(255),
                    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    lead_comments TEXT,
                    assigned_agent_id INTEGER REFERENCES users(user_id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # 5. Create leads table if it doesn't exist (for backwards compatibility)
            print("📋 Creating/updating leads table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS leads (
                    lead_id SERIAL PRIMARY KEY,
                    customer_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(50),
                    status VARCHAR(50) DEFAULT 'new',
                    lead_score INTEGER DEFAULT 0,
                    property_interested VARCHAR(255),
                    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    lead_comments TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # 6. Create interactions table if it doesn't exist
            print("📋 Creating/updating interactions table...")
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS interactions (
                    interaction_id SERIAL PRIMARY KEY,
                    session_id VARCHAR(255) NOT NULL,
                    action VARCHAR(100) NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    page VARCHAR(255),
                    user_agent TEXT,
                    element VARCHAR(255),
                    property_id VARCHAR(50),
                    property_label VARCHAR(255),
                    phone VARCHAR(50),
                    email VARCHAR(255),
                    referrer VARCHAR(500)
                )
            """))
            
            # 7. Add missing columns to existing tables
            print("🔧 Adding missing columns to tables...")
            
            # Add columns to properties table
            columns_to_add = [
                ("properties", "image_url", "TEXT"),
                ("properties", "assigned_agent_id", "INTEGER REFERENCES users(user_id)"),
                ("properties", "created_by", "INTEGER REFERENCES users(user_id)"),
                ("properties", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
                ("properties", "price", "DECIMAL(12,2)"),
                ("properties", "property_type", "VARCHAR(100)"),
                ("properties", "status", "VARCHAR(50) DEFAULT 'active'"),
                ("properties", "area", "INTEGER"),
                ("properties", "beds", "INTEGER"),
                ("properties", "baths", "INTEGER")
            ]
            
            for table, column, column_type in columns_to_add:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {column_type}"))
                    print(f"✅ Added column {column} to {table}")
                except Exception as e:
                    print(f"⚠️ Column {column} already exists in {table}: {e}")
            
            # Add columns to users table
            user_columns = [
                ("users", "assigned_agent_id", "INTEGER REFERENCES users(user_id)"),
                ("users", "role", "VARCHAR(50) DEFAULT 'agent'"),
                ("users", "profile_picture", "TEXT"),
                ("users", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for table, column, column_type in user_columns:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {column_type}"))
                    print(f"✅ Added column {column} to {table}")
                except Exception as e:
                    print(f"⚠️ Column {column} already exists in {table}: {e}")
            
            # Add columns to agent_profiles table
            profile_columns = [
                ("agent_profiles", "specialization", "VARCHAR(255)"),
                ("agent_profiles", "bio", "TEXT"),
                ("agent_profiles", "public_url", "VARCHAR(255) NOT NULL DEFAULT 'agent'"),
                ("agent_profiles", "phone", "VARCHAR(50)"),
                ("agent_profiles", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            ]
            
            for table, column, column_type in profile_columns:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {column_type}"))
                    print(f"✅ Added column {column} to {table}")
                except Exception as e:
                    print(f"⚠️ Column {column} already exists in {table}: {e}")
            
            # Add columns to lead_info table
            lead_columns = [
                ("lead_info", "assigned_agent_id", "INTEGER REFERENCES users(user_id)"),
                ("lead_info", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
                ("lead_info", "updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
                ("lead_info", "lead_score", "INTEGER DEFAULT 0"),
                ("lead_info", "property_interested", "VARCHAR(255)"),
                ("lead_info", "lead_comments", "TEXT")
            ]
            
            for table, column, column_type in lead_columns:
                try:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {column_type}"))
                    print(f"✅ Added column {column} to {table}")
                except Exception as e:
                    print(f"⚠️ Column {column} already exists in {table}: {e}")
            
            # 8. Create indexes for better performance
            print("🚀 Creating indexes for better performance...")
            indexes = [
                ("CREATE INDEX IF NOT EXISTS idx_properties_assigned_agent ON properties(assigned_agent_id)"),
                ("CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)"),
                ("CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type)"),
                ("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)"),
                ("CREATE INDEX IF NOT EXISTS idx_lead_info_assigned_agent ON lead_info(assigned_agent_id)"),
                ("CREATE INDEX IF NOT EXISTS idx_lead_info_status ON lead_info(status)"),
                ("CREATE INDEX IF NOT EXISTS idx_interactions_session ON interactions(session_id)"),
                ("CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp)")
            ]
            
            for index_sql in indexes:
                try:
                    conn.execute(text(index_sql))
                    print(f"✅ Created index")
                except Exception as e:
                    print(f"⚠️ Index already exists: {e}")
            
            # 9. Insert default admin user if no users exist
            print("👑 Checking for default admin user...")
            user_count = conn.execute(text("SELECT COUNT(*) FROM users")).fetchone()[0]
            
            if user_count == 0:
                print("👑 Creating default admin user...")
                conn.execute(text("""
                    INSERT INTO users (email, name, role) 
                    VALUES ('admin@realestate.com', 'System Administrator', 'admin')
                """))
                print("✅ Default admin user created")
            else:
                print(f"✅ {user_count} users already exist")
            
            print("🎉 Database schema update completed successfully!")
            
        except Exception as e:
            print(f"❌ Error updating database schema: {e}")
            raise

if __name__ == "__main__":
    update_database_schema() 