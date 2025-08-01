#!/bin/bash

# Real Estate CRM Setup Script
# This script automates the installation and setup process

set -e  # Exit on any error

echo "🏠 Real Estate CRM Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Detected macOS system"
else
    print_warning "This script is optimized for macOS. Some commands may need adjustment for other systems."
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python found: $PYTHON_VERSION"
else
    print_error "Python 3 not found. Please install Python 3.12+"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    print_success "PostgreSQL found"
else
    print_warning "PostgreSQL not found. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install postgresql
        brew services start postgresql
        print_success "PostgreSQL installed and started"
    else
        print_error "Homebrew not found. Please install PostgreSQL manually."
        exit 1
    fi
fi

# Check if we're in the right directory
if [ ! -f "requirements.txt" ] || [ ! -d "frontend" ] || [ ! -d "api" ]; then
    print_error "Please run this script from the real_estate_CRM root directory"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cat > .env << EOF
POSTGRES_USER=chinmaydhamapurkar
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=real_estate_crm
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
EOF
    print_warning "Please update the .env file with your actual database credentials"
else
    print_success ".env file already exists"
fi

# Database setup
print_status "Setting up database..."

# Create database and user
if psql -lqt | cut -d \| -f 1 | grep -qw real_estate_crm; then
    print_success "Database 'real_estate_crm' already exists"
else
    print_status "Creating database 'real_estate_crm'..."
    createdb real_estate_crm
    print_success "Database created"
fi

# Create user if it doesn't exist
if psql -d real_estate_crm -t -c "SELECT 1 FROM pg_roles WHERE rolname='chinmaydhamapurkar'" | grep -q 1; then
    print_success "User 'chinmaydhamapurkar' already exists"
else
    print_status "Creating user 'chinmaydhamapurkar'..."
    psql -d real_estate_crm -c "CREATE USER chinmaydhamapurkar WITH PASSWORD 'your_password_here';"
    psql -d real_estate_crm -c "GRANT ALL PRIVILEGES ON DATABASE real_estate_crm TO chinmaydhamapurkar;"
    print_success "User created"
fi

# Backend setup
print_status "Setting up backend..."

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    print_status "Installing Python dependencies..."
    pip3 install -r requirements.txt
    print_success "Python dependencies installed"
else
    print_error "requirements.txt not found"
    exit 1
fi

# Frontend setup
print_status "Setting up frontend..."

cd frontend

# Install Node.js dependencies
if [ -f "package.json" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
    print_success "Node.js dependencies installed"
else
    print_error "package.json not found in frontend directory"
    exit 1
fi

cd ..

# Create startup scripts
print_status "Creating startup scripts..."

# Backend startup script
cat > start_backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Real Estate CRM Backend..."
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
EOF

# Frontend startup script
cat > start_frontend.sh << 'EOF'
#!/bin/bash
echo "🎨 Starting Real Estate CRM Frontend..."
cd frontend
npm start
EOF

# Full startup script
cat > start_all.sh << 'EOF'
#!/bin/bash
echo "🏠 Starting Real Estate CRM System..."

# Function to cleanup background processes
cleanup() {
    echo "Shutting down servers..."
    pkill -f "uvicorn main:app"
    pkill -f "react-scripts"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend server..."
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ Real Estate CRM is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF

# Make scripts executable
chmod +x start_backend.sh start_frontend.sh start_all.sh

print_success "Startup scripts created"

# Create a test script
cat > test_system.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Real Estate CRM System..."

# Test database connection
echo "Testing database connection..."
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()

import psycopg2
try:
    conn = psycopg2.connect(
        host=os.getenv('POSTGRES_HOST'),
        database=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD')
    )
    print('✅ Database connection successful')
    conn.close()
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"

# Test backend API
echo "Testing backend API..."
if curl -s http://localhost:8000/properties > /dev/null; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API is not responding (make sure it's running)"
fi

# Test frontend
echo "Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding (make sure it's running)"
fi

echo "🎉 System test completed!"
EOF

chmod +x test_system.sh

print_success "Test script created"

# Create a sample data script
cat > add_sample_data.py << 'EOF'
#!/usr/bin/env python3
"""
Sample Data Generator for Real Estate CRM
This script adds sample properties and users to the database
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def add_sample_data():
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            database=os.getenv('POSTGRES_DB'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD')
        )
        
        cursor = conn.cursor()
        
        # Sample properties
        properties = [
            ("Modern Downtown Apartment", 250000, "Downtown", "Available"),
            ("Suburban Family Home", 450000, "Suburbs", "Available"),
            ("Luxury Penthouse", 850000, "City Center", "Available"),
            ("Cozy Studio", 180000, "University Area", "Available"),
            ("Waterfront Condo", 650000, "Harbor District", "Available")
        ]
        
        # Insert properties
        for prop in properties:
            cursor.execute("""
                INSERT INTO property_info (property_label, price, location, status)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, prop)
        
        # Sample users
        users = [
            ("john.doe@example.com", "John Doe", "+1234567890"),
            ("jane.smith@example.com", "Jane Smith", "+1234567891"),
            ("mike.johnson@example.com", "Mike Johnson", "+1234567892")
        ]
        
        # Insert users
        for user in users:
            cursor.execute("""
                INSERT INTO user_basic_info (user_id, customer_name, phone)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
            """, user)
        
        conn.commit()
        print("✅ Sample data added successfully!")
        
    except Exception as e:
        print(f"❌ Error adding sample data: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_sample_data()
EOF

chmod +x add_sample_data.py

print_success "Sample data script created"

# Final instructions
echo ""
echo "🎉 Real Estate CRM Setup Complete!"
echo "================================"
echo ""
echo "📁 Files created:"
echo "  - .env (update with your database credentials)"
echo "  - start_backend.sh (start backend server)"
echo "  - start_frontend.sh (start frontend server)"
echo "  - start_all.sh (start both servers)"
echo "  - test_system.sh (test system functionality)"
echo "  - add_sample_data.py (add sample data)"
echo ""
echo "🚀 Quick Start:"
echo "  1. Update .env file with your database credentials"
echo "  2. Run: ./start_all.sh"
echo "  3. Open: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "  - README.md (comprehensive guide)"
echo "  - SYSTEM_FLOW.md (system flow diagrams)"
echo ""
echo "🧪 Testing:"
echo "  - Run: ./test_system.sh (after starting servers)"
echo "  - Run: python3 add_sample_data.py (to add sample data)"
echo ""
print_success "Setup completed successfully!" 