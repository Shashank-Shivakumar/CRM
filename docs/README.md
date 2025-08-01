# Real Estate CRM System

A full-stack web application for managing real estate properties and customer enquiries with lead scoring and CRM functionality. Built by **Zero2one.ai** for **Onest Realestate**.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  FastAPI Backend│    │ PostgreSQL DB   │
│   (Port 3000)   │◄──►│   (Port 8000)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Flow](#system-flow)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Frontend Components](#frontend-components)
- [Lead Scoring Algorithm](#lead-scoring-algorithm)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Professional Branding**: Zero2one.ai (CRM Developer) and Onest Realestate (Real Estate Company) branding
- **Property Management**: Browse and view property listings with modern UI
- **Enquiry System**: Submit property enquiries with contact information
- **CRM Dashboard**: Manage leads with status tracking and notes
- **Lead Scoring**: Automatic lead quality assessment (0-100 points) with click tracking
- **Real-time Updates**: Live data synchronization between frontend and backend
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **Interactive UI**: Hover effects, animations, and modern design elements
- **Navigation**: Seamless navigation between Properties and CRM Dashboard

## 🛠️ Technology Stack

### Frontend
- **React 19.1.0**: UI framework
- **React Router DOM 7.7.0**: Client-side routing
- **Tailwind CSS 3.4.0**: Utility-first CSS framework
- **PostCSS**: CSS processing

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **Uvicorn**: ASGI server
- **Psycopg2**: PostgreSQL adapter

### Database
- **PostgreSQL**: Relational database
- **Environment Variables**: Secure configuration management

## 🔄 System Flow

### 1. Application Startup Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───►│  Frontend   │───►│   Backend   │───►│  Database   │
│  Browser    │    │  (React)    │    │  (FastAPI)  │    │(PostgreSQL) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │             1. npm start        2. uvicorn start     3. DB Connect
       │             4. Load App         5. API Ready         6. Tables Ready
       │             7. Render UI        8. CORS Setup        9. Data Available
       │
       └─────────────► 10. User sees Property Listings with Company Branding
```

### 2. Property Browsing Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───►│  Properties │───►│  GET /      │───►│  property_  │
│  Visits     │    │   Page      │    │ properties  │    │   info      │
│  Website    │    │             │    │             │    │   table     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │             1. Component        2. API Call         3. SQL Query
       │                Mounts          3. Fetch Data       4. Return JSON
       │             4. Render List      5. Update State     6. Display UI
       │             5. Show Branding    6. Track Clicks     7. Calculate Scores
       │
       └─────────────► 8. User sees Available Properties with Modern Design
```

### 3. Enquiry Submission Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───►│  Enquiry    │───►│  POST /     │───►│  Database   │
│  Fills      │    │   Form      │    │  enquiry    │    │  Transaction│
│  Form       │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │             1. Form Submit      2. Validation        3. Insert User
       │             4. Show Success     5. Insert Lead       6. Insert Lead
       │             7. Reset Form       8. Calculate Score   9. Commit TX
       │             8. Track Interaction9. Update Property   10. Return Success
       │
       └─────────────► 11. Lead appears in CRM Dashboard with Score
```

### 4. CRM Dashboard Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Admin     │───►│  CRM        │───►│  GET /      │───►│  lead_info  │
│  Accesses   │    │  Dashboard  │    │  leads      │    │   table     │
│  CRM        │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │             1. Component        2. API Call         3. SQL Query
       │                Mounts          4. Fetch Leads      5. Join Tables
       │             6. Display Table    7. Calculate        8. Return Data
       │             8. Show Actions     8. Lead Scores      9. Update UI
       │             9. Show Branding    10. Track Stats     11. Display Stats
       │
       └─────────────► 12. Admin can View/Contact/Update Leads with Modern UI
```

## 🗄️ Database Schema

### Core Tables

#### 1. `user_basic_info`
```sql
- user_id (PK): VARCHAR - Email address
- customer_name: VARCHAR - Full name
- phone: VARCHAR - Contact number
- created_date: DATE - Registration date
```

#### 2. `property_info`
```sql
- property_id (PK): SERIAL - Unique identifier
- property_label: VARCHAR - Property name/description
- property_address: VARCHAR - Property address
- property_price: DECIMAL - Property price
- property_type: VARCHAR - Property type (Apartment, Villa, etc.)
- property_area: VARCHAR - Property area
- property_beds: INTEGER - Number of bedrooms
- property_baths: INTEGER - Number of bathrooms
- property_description: TEXT - Property description
- status: VARCHAR - Available/Sold/Rented
```

#### 3. `lead_info`
```sql
- lead_id (PK): SERIAL - Unique identifier
- user_id (FK): VARCHAR - References user_basic_info
- property_id (FK): INTEGER - References property_info
- price: DECIMAL - Interested price range
- status: VARCHAR - new/follow_up/converted
- category: VARCHAR - Lead category
- sub_category: VARCHAR - Lead sub-category
- lead_scode: VARCHAR - Lead source code
- lead_comments: TEXT - Customer message
- created_date: DATE - Lead creation date
```

#### 4. `lead_additional_info`
```sql
- lead_id (FK): INTEGER - References lead_info
- created_by (FK): VARCHAR - References user_basic_info
- created_date: DATE - Record creation date
- created_time: TIME - Record creation time
- source: VARCHAR - Lead source (website, phone, etc.)
```

#### 5. `user_interactions` (New)
```sql
- interaction_id (PK): SERIAL - Unique identifier
- session_id: VARCHAR - User session identifier
- action_type: VARCHAR - Type of interaction (click, view, etc.)
- element_id: VARCHAR - Element that was interacted with
- page_url: VARCHAR - Page where interaction occurred
- property_id: VARCHAR - Property being viewed
- property_label: VARCHAR - Property name
- phone: VARCHAR - User phone (if provided)
- email: VARCHAR - User email (if provided)
- referrer: VARCHAR - Referrer URL
- user_agent: TEXT - Browser information
- timestamp: TIMESTAMP - Interaction timestamp
- engagement_score: INTEGER - Calculated engagement score
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 20+ and npm
- Python 3.12+
- PostgreSQL 12+
- Git

### 1. Clone Repository
```bash
git clone <repository-url>
cd real_estate_CRM
```

### 2. Database Setup
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database and user
createdb real_estate_crm
psql -d real_estate_crm -c "CREATE USER chinmaydhamapurkar WITH PASSWORD 'your_password';"
psql -d real_estate_crm -c "GRANT ALL PRIVILEGES ON DATABASE real_estate_crm TO chinmaydhamapurkar;"
```

### 3. Environment Configuration
Create `.env` file in the root directory:
```env
POSTGRES_USER=chinmaydhamapurkar
POSTGRES_PASSWORD=your_password
POSTGRES_DB=real_estate_crm
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### 4. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start backend server
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Start frontend development server
npm start
```

### 6. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 📚 API Documentation

### Property Endpoints

#### GET `/properties`
Returns list of all available properties.
```json
{
  "properties": [
    {
      "property_id": 1,
      "property_label": "Modern Downtown Apartment",
      "property_address": "123 Main Street, Downtown",
      "property_price": 250000,
      "property_type": "Apartment",
      "property_area": "1,200 sq ft",
      "property_beds": 2,
      "property_baths": 2,
      "property_description": "Beautiful modern apartment in the heart of downtown.",
      "status": "Available"
    }
  ]
}
```

#### GET `/properties/{property_id}`
Returns detailed information about a specific property.

### Enquiry Endpoints

#### POST `/enquiry`
Submit a new property enquiry.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "message": "I'm interested in this property",
  "property_id": 1
}
```

### CRM Endpoints

#### GET `/leads`
Returns all leads with scoring and status.
```json
{
  "leads": [
    {
      "lead_id": 1,
      "customer_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "new",
      "lead_score": 75,
      "property_interested": "Modern Downtown Apartment",
      "created_date": "2024-01-15",
      "lead_comments": "I'm interested in this property"
    }
  ]
}
```

#### GET `/leads/{lead_id}`
Returns detailed information about a specific lead.

#### PUT `/leads/{lead_id}/status`
Update lead status and add notes.
```json
{
  "status": "follow_up",
  "notes": "Called customer, interested in viewing"
}
```

#### GET `/leads/stats/summary`
Returns CRM dashboard statistics.
```json
{
  "total_leads": 25,
  "new_leads": 10,
  "follow_up_leads": 8,
  "converted_leads": 5,
  "lost_leads": 2,
  "average_score": 68.5
}
```

### Interaction Tracking Endpoints

#### POST `/track-interaction`
Track user interactions for lead scoring.
```json
{
  "sessionId": "session123",
  "action": "click",
  "timestamp": "2024-01-15T10:30:00Z",
  "page": "/properties",
  "userAgent": "Mozilla/5.0...",
  "element": "property-card",
  "propertyId": "1",
  "propertyLabel": "Modern Downtown Apartment"
}
```

## 🎨 Frontend Components

### Core Components

#### 1. `App.js` - Main Application Router
- Handles routing between pages
- Provides navigation structure
- Manages global state

#### 2. `Properties.js` - Property Listings
- Displays all available properties with modern design
- Implements search and filtering
- Links to property details
- Features company branding (Zero2one.ai & Onest Realestate)
- Includes CRM Dashboard navigation button

#### 3. `PropertyDetail.js` - Property Details
- Shows detailed property information
- Contains enquiry form
- Handles enquiry submission
- Features consistent branding and navigation

#### 4. `EnquiryForm.js` - Contact Form
- Collects customer information
- Validates form inputs
- Submits enquiries to backend
- Modern styling with Tailwind CSS

#### 5. `CRM.js` - CRM Dashboard
- Displays lead management interface
- Shows lead statistics
- Provides lead actions (View, Contact, Update)
- Features company branding and navigation

### Component Hierarchy
```
App.js
├── Properties.js
│   ├── Header (Company Branding)
│   ├── Hero Section (Exceptional Properties)
│   ├── Property Cards
│   └── Footer
│   └── PropertyDetail.js
│       ├── Header (Company Branding)
│       ├── Property Gallery
│       ├── Property Details
│       └── EnquiryForm.js
└── CRM.js
    ├── Header (Company Branding)
    ├── LeadStats
    ├── LeadTable
    ├── ViewLeadModal
    ├── ContactLeadModal
    └── StatusUpdateModal
```

## 🎯 Lead Scoring Algorithm

The system automatically calculates lead scores (0-100) based on multiple factors including user interactions:

### Scoring Criteria
```python
def calculate_lead_score(lead_data, interactions=None):
    score = 0
    score += 10  # Base score
    
    # Message length scoring
    if lead_data.get('lead_comments'):
        message_length = len(lead_data['lead_comments'])
        if message_length > 100: score += 20
        elif message_length > 50: score += 15
        elif message_length > 20: score += 10
        else: score += 5
    
    # Email domain scoring
    email = lead_data.get('user_id', '')
    if email:
        domain = email.split('@')[-1].lower()
        if domain in ['gmail.com', 'yahoo.com', 'hotmail.com']: score += 5
        else: score += 15  # Business email
    
    # Name completeness scoring
    customer_name = lead_data.get('customer_name', '')
    if customer_name and len(customer_name.split()) >= 2: score += 10
    
    # Interaction-based scoring
    if interactions:
        for interaction in interactions:
            if interaction['action_type'] == 'click':
                score += 5
            elif interaction['action_type'] == 'view':
                score += 2
            elif interaction['action_type'] == 'form_submit':
                score += 20
    
    # Recency scoring
    if lead_data.get('created_date'): score += 5
    
    return min(score, 100)  # Cap at 100
```

### Score Interpretation
- **90-100**: Hot Lead (Immediate attention required)
- **70-89**: Warm Lead (Follow up within 24 hours)
- **50-69**: Lukewarm Lead (Follow up within 48 hours)
- **30-49**: Cold Lead (Follow up within a week)
- **0-29**: Very Cold Lead (Low priority)

## 📖 Usage Guide

### For Property Buyers/Renters

1. **Browse Properties**
   - Visit http://localhost:3000
   - View available properties with modern design
   - Click on property for details

2. **Submit Enquiry**
   - Fill out contact form
   - Provide detailed message
   - Submit enquiry

3. **Track Response**
   - Wait for agent contact
   - Check email for updates

### For Real Estate Agents

1. **Access CRM Dashboard**
   - Navigate to CRM section via dashboard button
   - View all leads with scores

2. **Manage Leads**
   - Review lead details
   - Update lead status
   - Add notes and comments

3. **Prioritize Follow-ups**
   - Focus on high-scoring leads
   - Contact leads based on score
   - Track conversion rates

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill processes using port 3000
lsof -ti:3000 | xargs kill -9

# Kill processes using port 8000
lsof -ti:8000 | xargs kill -9
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql

# Test connection
psql -h localhost -U chinmaydhamapurkar -d real_estate_crm
```

#### 3. Frontend Build Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Backend Import Errors
```bash
# Install missing dependencies
pip install -r requirements.txt

# Check Python path
python -c "import sys; print(sys.path)"
```

### Error Logs

#### Frontend Errors
- Check browser console (F12)
- Review npm start output
- Verify environment variables

#### Backend Errors
- Check uvicorn server logs
- Review database connection
- Verify API endpoint responses

#### Database Errors
- Check PostgreSQL logs
- Verify table structure
- Confirm user permissions

## 🔄 Development Workflow

### Adding New Features

1. **Backend Development**
   ```bash
   # Add new endpoint in api/main.py
   # Update database schema if needed
   # Test with curl or Postman
   ```

2. **Frontend Development**
   ```bash
   # Create new React component
   # Add routing in App.js
   # Update API calls
   ```

3. **Testing**
   ```bash
   # Test backend endpoints
   curl -X GET http://localhost:8000/properties
   
   # Test frontend functionality
   # Verify UI responsiveness
   ```

### Code Structure
```
real_estate_CRM/
├── api/                    # Backend code
│   ├── main.py            # FastAPI application
│   ├── database.py        # Database configuration
│   └── models.py          # Data models
├── frontend/              # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── App.js         # Main application
│   └── package.json       # Dependencies
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 📈 Performance Optimization

### Frontend
- React.memo for component optimization
- Lazy loading for routes
- Image optimization
- Bundle size analysis

### Backend
- Database query optimization
- Connection pooling
- Caching strategies
- API response compression

### Database
- Index optimization
- Query performance monitoring
- Regular maintenance
- Backup strategies

## 🔒 Security Considerations

### Frontend Security
- Input validation
- XSS prevention
- CSRF protection
- Secure HTTP headers

### Backend Security
- API authentication
- Input sanitization
- SQL injection prevention
- Rate limiting

### Database Security
- User permission management
- Data encryption
- Regular backups
- Access logging

## 📞 Support

For technical support or questions:
- Check the troubleshooting section
- Review API documentation
- Test with provided examples
- Verify environment setup

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Real Estate CRM System** - Built by **Zero2one.ai** for **Onest Realestate**. Streamlining property management and lead generation for real estate professionals.
