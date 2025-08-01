# 🏠 Real Estate CRM

A comprehensive Real Estate Customer Relationship Management system built with FastAPI, React, and PostgreSQL. Features include property management, lead tracking, agent dashboards, and a beautiful public-facing property listing.

## ✨ Features

### 🏢 **Property Management**
- **Public Property Listings**: Beautiful, responsive property showcase
- **Property Details**: Comprehensive property information with images
- **Advanced Filtering**: Filter by property type, sort by price, beds, area
- **Agent Assignment**: Assign properties to specific agents
- **Image Support**: Property images with fallback handling

### 👥 **User Management**
- **Role-Based Access**: Admin, Agent, and Customer roles
- **Google OAuth**: Secure authentication via Google
- **Agent Profiles**: Specialized agent profiles with public URLs
- **Admin Controls**: Create and manage users, assign roles

### 📊 **Lead Management**
- **Lead Tracking**: Comprehensive lead information and status
- **Lead Scoring**: Automated lead scoring based on interactions
- **Agent Assignment**: Assign leads to specific agents
- **CRM Dashboard**: Full lead management interface

### 🎯 **Agent Dashboard**
- **Personalized View**: Agents see only their assigned properties and leads
- **Performance Stats**: Real-time statistics and conversion rates
- **Lead Management**: Complete lead tracking and management
- **Property Management**: Manage assigned properties

### 👑 **Admin Dashboard**
- **System Overview**: Complete system statistics
- **User Management**: Create and manage all users
- **Property Management**: Full property CRUD operations
- **Analytics**: Detailed analytics and reporting

### 🎨 **Beautiful UI/UX**
- **Modern Design**: Light blue and white theme with glass effects
- **Responsive**: Works perfectly on all devices
- **Animations**: Smooth animations and transitions
- **Interactive**: Rich user interactions and feedback

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL database
- Google OAuth credentials

### 1. Clone and Setup
```bash
git clone <repository-url>
cd real_estate_CRM
```

### 2. Backend Setup
```bash
cd code_base/crm_api

# Install dependencies
pip install -r requirements.txt

# Update database schema
python update_database_schema.py

# Start the backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd code_base/crm_ui

# Install dependencies
npm install

# Start the frontend server
npm start
```

### 4. Access the Application
- **Public Site**: http://localhost:3000/properties
- **Admin Dashboard**: http://localhost:3000/admin
- **Agent Dashboard**: http://localhost:3000/agent
- **API Documentation**: http://localhost:8000/docs

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts with role-based access
- **properties**: Property listings with full details
- **agent_profiles**: Agent-specific information
- **lead_info**: Lead management and tracking
- **interactions**: User interaction tracking

### Key Features
- **Foreign Key Relationships**: Proper data integrity
- **Indexes**: Optimized for performance
- **Timestamps**: Full audit trail
- **Soft Deletes**: Data preservation

## 🔧 Configuration

### Environment Variables
```bash
# Database
CLOUD_POSTGRES_HOST=your-db-host
CLOUD_POSTGRES_PORT=your-db-port
CLOUD_POSTGRES_DB=your-db-name
CLOUD_POSTGRES_USER=your-db-user
CLOUD_POSTGRES_PASSWORD=your-db-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT
JWT_SECRET_KEY=your-jwt-secret
```

## 📱 API Endpoints

### Authentication
- `POST /auth/google` - Google OAuth login
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout

### Public
- `GET /properties` - List all properties
- `GET /properties/{id}` - Get property details
- `POST /enquiry` - Submit property enquiry

### Admin Only
- `GET /admin/stats` - System statistics
- `GET /admin/properties` - Manage properties
- `GET /admin/users` - Manage users
- `POST /admin/users` - Create users
- `PUT /admin/users/{id}/role` - Update user role

### Agent Only
- `GET /agent/stats` - Agent statistics
- `GET /agent/properties` - Agent's properties
- `GET /agent/leads` - Agent's leads
- `GET /agent/profile` - Agent profile

## 🎯 Key Features

### 🔐 **Security**
- JWT-based authentication
- Google OAuth integration
- Role-based access control
- Secure API endpoints

### 📊 **Analytics**
- Lead scoring algorithms
- Interaction tracking
- Performance metrics
- Conversion tracking

### 🎨 **UI/UX**
- Modern, responsive design
- Smooth animations
- Glass morphism effects
- Mobile-first approach

### 🔧 **Developer Experience**
- Comprehensive API documentation
- Type-safe development
- Hot reloading
- Debug logging

## 🏗️ Architecture

### Backend (FastAPI)
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: Database ORM
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **Pydantic**: Data validation

### Frontend (React)
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Context API**: State management

### Database (PostgreSQL)
- **Relational**: Proper relationships
- **Indexed**: Performance optimized
- **ACID**: Data integrity
- **Scalable**: Production ready

## 🚀 Deployment

### Docker Support
```bash
# Backend
cd docker_files/crm_api
docker build -t real-estate-crm-api .
docker run -p 8000:8000 real-estate-crm-api

# Frontend
cd docker_files/crm_ui
docker build -t real-estate-crm-ui .
docker run -p 3000:3000 real-estate-crm-ui
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database schema updated
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring setup
- [ ] Backup strategy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for the Real Estate Industry** 