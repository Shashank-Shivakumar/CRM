# 🗄️ Real Estate CRM - Complete Database Schema

## 📊 Overview

This document provides the complete data model for the Real Estate CRM system, including all tables, relationships, and data structures.

## 🏗️ Database Architecture

### **Database Type:** PostgreSQL (Cloud)
### **Connection:** SSL Encrypted
### **Collaboration:** Multi-user real-time access

---

## 📋 Table Structure

### 1. **user_basic_info** - Core User Information
```sql
CREATE TABLE user_basic_info (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user'
);
```

**Purpose:** Stores basic user authentication and profile information
**Key Fields:**
- `user_id` - Primary key for user identification
- `username` - Unique username for login
- `email` - User's email address
- `role` - User role (user, admin, agent)

---

### 2. **user_personal_info** - Extended Personal Information
```sql
CREATE TABLE user_personal_info (
    user_id INTEGER PRIMARY KEY REFERENCES user_basic_info(user_id),
    date_of_birth DATE,
    gender VARCHAR(10),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50),
    profile_picture_url VARCHAR(255),
    bio TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Stores additional personal information for users
**Relationships:**
- `user_id` → `user_basic_info.user_id` (One-to-One)

---

### 3. **user_professional_info** - Professional Details
```sql
CREATE TABLE user_professional_info (
    user_id INTEGER PRIMARY KEY REFERENCES user_basic_info(user_id),
    company_name VARCHAR(100),
    job_title VARCHAR(100),
    department VARCHAR(50),
    work_phone VARCHAR(20),
    work_email VARCHAR(100),
    linkedin_url VARCHAR(255),
    experience_years INTEGER,
    specializations TEXT[],
    license_number VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Stores professional information for real estate agents
**Relationships:**
- `user_id` → `user_basic_info.user_id` (One-to-One)

---

### 4. **user_contact_info** - Contact Information
```sql
CREATE TABLE user_contact_info (
    contact_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_basic_info(user_id),
    contact_type VARCHAR(20) NOT NULL, -- 'emergency', 'family', 'work'
    contact_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Stores multiple contact information for users
**Relationships:**
- `user_id` → `user_basic_info.user_id` (Many-to-One)

---

### 5. **user_roles** - User Role Management
```sql
CREATE TABLE user_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Manages user roles and permissions
**Sample Roles:**
- `admin` - Full system access
- `agent` - Real estate agent access
- `user` - Basic user access

---

### 6. **property_info** - Property Listings
```sql
CREATE TABLE property_info (
    property_id SERIAL PRIMARY KEY,
    property_label VARCHAR(100) NOT NULL,
    property_type VARCHAR(50) NOT NULL, -- 'apartment', 'house', 'villa', 'penthouse'
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    square_feet INTEGER,
    lot_size DECIMAL(10,2),
    year_built INTEGER,
    property_status VARCHAR(20) DEFAULT 'available', -- 'available', 'sold', 'pending'
    description TEXT,
    features TEXT[],
    images TEXT[],
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent_id INTEGER REFERENCES user_basic_info(user_id),
    is_featured BOOLEAN DEFAULT FALSE
);
```

**Purpose:** Stores all property listing information
**Key Fields:**
- `property_id` - Primary key for property identification
- `property_label` - Human-readable property name
- `price` - Property price in USD
- `agent_id` - Assigned real estate agent

---

### 7. **property_additional_info** - Extended Property Details
```sql
CREATE TABLE property_additional_info (
    property_id INTEGER PRIMARY KEY REFERENCES property_info(property_id),
    parking_spaces INTEGER,
    garage_type VARCHAR(50),
    heating_type VARCHAR(50),
    cooling_type VARCHAR(50),
    appliances TEXT[],
    flooring_type VARCHAR(100),
    roof_type VARCHAR(50),
    exterior_material VARCHAR(100),
    hoa_fees DECIMAL(8,2),
    property_tax DECIMAL(8,2),
    insurance_cost DECIMAL(8,2),
    utilities_included BOOLEAN DEFAULT FALSE,
    pet_policy VARCHAR(100),
    furnished_status VARCHAR(20),
    view_type VARCHAR(50),
    orientation VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Stores detailed property specifications
**Relationships:**
- `property_id` → `property_info.property_id` (One-to-One)

---

### 8. **lead_info** - Customer Lead Information
```sql
CREATE TABLE lead_info (
    lead_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
    lead_score INTEGER DEFAULT 0,
    source VARCHAR(50), -- 'website', 'referral', 'social_media', 'advertisement'
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    preferred_location TEXT[],
    property_type_preference VARCHAR(50)[],
    bedrooms_preference INTEGER,
    bathrooms_preference INTEGER,
    timeline VARCHAR(50), -- 'immediate', '3_months', '6_months', '1_year'
    financing_type VARCHAR(50), -- 'cash', 'mortgage', 'lease_to_own'
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_agent_id INTEGER REFERENCES user_basic_info(user_id),
    property_interested INTEGER REFERENCES property_info(property_id),
    lead_comments TEXT
);
```

**Purpose:** Stores potential customer information and preferences
**Key Fields:**
- `lead_id` - Primary key for lead identification
- `lead_score` - Automated scoring (0-100)
- `status` - Current lead status
- `assigned_agent_id` - Assigned real estate agent

---

### 9. **lead_additional_info** - Extended Lead Details
```sql
CREATE TABLE lead_additional_info (
    lead_id INTEGER PRIMARY KEY REFERENCES lead_info(lead_id),
    occupation VARCHAR(100),
    company VARCHAR(100),
    income_level VARCHAR(50),
    credit_score_range VARCHAR(20),
    down_payment_amount DECIMAL(12,2),
    pre_approval_status BOOLEAN DEFAULT FALSE,
    lender_name VARCHAR(100),
    loan_officer_contact VARCHAR(100),
    family_size INTEGER,
    children_count INTEGER,
    pets_count INTEGER,
    vehicle_count INTEGER,
    current_housing VARCHAR(50), -- 'renting', 'owning', 'living_with_family'
    current_rent_amount DECIMAL(8,2),
    moving_reason VARCHAR(100),
    urgency_level VARCHAR(20), -- 'low', 'medium', 'high', 'urgent'
    communication_preference VARCHAR(20), -- 'email', 'phone', 'sms', 'in_person'
    best_contact_time VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Stores detailed lead information for better qualification
**Relationships:**
- `lead_id` → `lead_info.lead_id` (One-to-One)

---

### 10. **user_interactions** - User Engagement Tracking
```sql
CREATE TABLE user_interactions (
    interaction_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES user_basic_info(user_id),
    lead_id INTEGER REFERENCES lead_info(lead_id),
    interaction_type VARCHAR(50) NOT NULL, -- 'page_view', 'property_view', 'contact_click', 'enquiry_form'
    interaction_data JSONB,
    session_id VARCHAR(100),
    page_url VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    score_impact INTEGER DEFAULT 0
);
```

**Purpose:** Tracks all user interactions for lead scoring
**Key Fields:**
- `interaction_type` - Type of user interaction
- `interaction_data` - JSON data about the interaction
- `score_impact` - Points added/subtracted from lead score

---

### 11. **listing_info** - Property Listing Management
```sql
CREATE TABLE listing_info (
    listing_id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES property_info(property_id),
    listing_type VARCHAR(20) NOT NULL, -- 'sale', 'rent', 'lease'
    listing_price DECIMAL(12,2) NOT NULL,
    listing_status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'sold', 'expired'
    listing_date DATE NOT NULL,
    expiry_date DATE,
    commission_rate DECIMAL(5,2),
    showing_instructions TEXT,
    lockbox_code VARCHAR(20),
    showing_availability JSONB,
    created_by INTEGER REFERENCES user_basic_info(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Manages property listings and showing information
**Relationships:**
- `property_id` → `property_info.property_id` (Many-to-One)

---

### 12. **listing_additional_info** - Extended Listing Details
```sql
CREATE TABLE listing_additional_info (
    listing_id INTEGER PRIMARY KEY REFERENCES listing_info(listing_id),
    virtual_tour_url VARCHAR(255),
    floor_plan_url VARCHAR(255),
    property_video_url VARCHAR(255),
    drone_photos TEXT[],
    interior_photos TEXT[],
    exterior_photos TEXT[],
    neighborhood_photos TEXT[],
    school_ratings JSONB,
    crime_stats JSONB,
    walk_score INTEGER,
    transit_score INTEGER,
    bike_score INTEGER,
    nearby_amenities TEXT[],
    property_history JSONB,
    tax_history JSONB,
    hoa_documents TEXT[],
    inspection_reports TEXT[],
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Stores additional listing materials and information
**Relationships:**
- `listing_id` → `listing_info.listing_id` (One-to-One)

---

## 🔗 Relationships Summary

### **One-to-One Relationships:**
- `user_basic_info` ↔ `user_personal_info`
- `user_basic_info` ↔ `user_professional_info`
- `property_info` ↔ `property_additional_info`
- `lead_info` ↔ `lead_additional_info`
- `listing_info` ↔ `listing_additional_info`

### **One-to-Many Relationships:**
- `user_basic_info` → `user_contact_info` (One user, many contacts)
- `user_basic_info` → `property_info` (One agent, many properties)
- `user_basic_info` → `lead_info` (One agent, many leads)
- `property_info` → `listing_info` (One property, many listings)
- `lead_info` → `user_interactions` (One lead, many interactions)

### **Many-to-Many Relationships:**
- `user_basic_info` ↔ `property_info` (Agents can manage multiple properties, properties can have multiple agents)

---

## 📊 Data Flow

### **Lead Generation Flow:**
1. User visits website → `user_interactions` (page_view)
2. User views property → `user_interactions` (property_view)
3. User fills enquiry form → `lead_info` (new lead created)
4. Lead assigned to agent → `lead_info.assigned_agent_id`
5. Agent updates lead status → `lead_info.status`

### **Property Management Flow:**
1. Agent creates property → `property_info`
2. Agent adds listing → `listing_info`
3. Agent uploads photos → `listing_additional_info`
4. Property gets views → `user_interactions`
5. Property gets enquiries → `lead_info`

### **User Management Flow:**
1. User registers → `user_basic_info`
2. User adds personal info → `user_personal_info`
3. User adds professional info → `user_professional_info`
4. User adds contacts → `user_contact_info`
5. User gets role assigned → `user_roles`

---

## 🎯 Key Features Supported

### **Lead Scoring System:**
- Automated scoring based on interactions
- Score range: 0-100 points
- Factors: page views, property views, form submissions, contact clicks

### **Multi-User Collaboration:**
- Multiple agents can work simultaneously
- Real-time data synchronization
- Role-based access control

### **Property Management:**
- Comprehensive property details
- Multiple listing types (sale, rent, lease)
- Rich media support (photos, videos, virtual tours)

### **Customer Relationship Management:**
- Detailed lead profiles
- Interaction tracking
- Communication history
- Status management

### **Analytics & Reporting:**
- Lead statistics
- Property performance metrics
- User engagement analytics
- Conversion tracking

---

## 🔒 Security Features

### **Data Protection:**
- SSL encrypted connections
- Password hashing
- Role-based access control
- Input validation

### **Audit Trail:**
- All interactions timestamped
- User activity tracking
- Data modification history

---

## 📈 Performance Optimizations

### **Indexing Strategy:**
- Primary keys on all tables
- Foreign key indexes
- Composite indexes on frequently queried fields
- Full-text search indexes on property descriptions

### **Query Optimization:**
- Efficient joins using foreign keys
- Pagination for large datasets
- Caching for frequently accessed data

---

## 🚀 Deployment Considerations

### **Cloud Database:**
- PostgreSQL on cloud infrastructure
- Automatic backups
- High availability
- Scalable storage

### **Multi-User Support:**
- Concurrent access handling
- Real-time synchronization
- Conflict resolution

---

**This schema supports a complete Real Estate CRM system with advanced features for lead management, property listings, and user collaboration.** 🏠✨ 