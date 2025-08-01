# 🏠 Real Estate CRM - Admin Setup Guide

## 👑 **Current Admin Status**

✅ **Admin Account:** `chinmaydhama25@gmail.com` (chinmay dhama)
👤 **Agent Account:** `chinmaydhamma@gmail.com` (Chinmay Dhamma)

## 🔧 **How to Identify and Manage Admin Access**

### **Method 1: Automatic Admin Assignment**

The system automatically assigns admin role to:
1. **First user** who logs in (becomes admin automatically)
2. **Specific email addresses** (configured in `auth_utils.py`)

```python
# Current admin emails in auth_utils.py
admin_emails = [
    "chinmaydhamapurkar25@gmail.com",
    "admin@realestatecrm.com", 
    "chinmay@zero2one.ai"
]
```

### **Method 2: Manual Admin Assignment**

#### **Using the Admin Setup Script:**

```bash
cd code_base/crm_api
python3 setup_admin.py
```

#### **Using the Quick Admin Script:**

```bash
cd code_base/crm_api
python3 make_admin.py <email_address>
```

**Example:**
```bash
python3 make_admin.py chinmaydhama25@gmail.com
```

### **Method 3: Direct Database Update**

```sql
-- Make a user admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Check current users and roles
SELECT email, name, role, created_at FROM users ORDER BY created_at DESC;
```

## 🔍 **How to Check Admin Status**

### **1. Using the Setup Script:**
```bash
cd code_base/crm_api
python3 setup_admin.py
# Choose option 3 to list all users
```

### **2. Using the API:**
```bash
# Get current user info (requires authentication)
curl -H "Authorization: Bearer <your_token>" http://localhost:8000/auth/me

# List all users (admin only)
curl -H "Authorization: Bearer <your_token>" http://localhost:8000/admin/users
```

### **3. Using the Frontend:**
- Login to the application
- Check the user badge in the header (shows "Admin" or "Agent")
- Navigate to `/admin` - only admins can access this route

## 🎯 **Admin vs Agent Capabilities**

### **👑 Admin Capabilities:**
- ✅ View all properties in the system
- ✅ Create, edit, and delete any property
- ✅ Assign properties to agents
- ✅ Manage all users (change roles)
- ✅ Access admin dashboard (`/admin`)
- ✅ View system-wide analytics
- ✅ Approve agent-created properties

### **👤 Agent Capabilities:**
- ✅ View only assigned properties
- ✅ Create new properties (pending admin approval)
- ✅ Edit assigned properties
- ✅ Manage their own leads
- ✅ Create and manage public profile
- ✅ Access agent dashboard (`/agent`)

## 🚀 **Testing Admin Access**

### **Step 1: Login as Admin**
1. Go to `http://localhost:3000`
2. Click "Sign In"
3. Login with `chinmaydhama25@gmail.com`
4. You should see "Admin" badge in the header

### **Step 2: Access Admin Dashboard**
1. Navigate to `/admin` or click "Admin Panel" in the header
2. You should see the admin dashboard with:
   - System overview stats
   - Property management
   - User management
   - Analytics

### **Step 3: Test Admin Functions**
1. **Property Management:**
   - View all properties
   - Assign properties to agents
   - Create new properties

2. **User Management:**
   - View all users
   - Change user roles
   - Monitor user activity

## 🔐 **Security Notes**

### **Admin Email Configuration:**
To add more admin emails, edit `code_base/crm_api/auth_utils.py`:

```python
admin_emails = [
    "chinmaydhamapurkar25@gmail.com",  # Your email
    "admin@realestatecrm.com",
    "chinmay@zero2one.ai",
    "newadmin@example.com"  # Add new admin emails here
]
```

### **First User Admin Rule:**
- The first user who logs in automatically becomes admin
- This ensures there's always at least one admin in the system

### **Role Persistence:**
- User roles are stored in the database
- Roles persist across sessions
- Only admins can change user roles

## 🛠️ **Troubleshooting**

### **Problem: No Admin Access**
**Solution:**
```bash
cd code_base/crm_api
python3 make_admin.py your-email@gmail.com
```

### **Problem: Can't Access Admin Dashboard**
**Check:**
1. Verify you're logged in with admin account
2. Check browser console for errors
3. Verify backend is running on port 8000

### **Problem: New Users Not Getting Admin Role**
**Check:**
1. Verify your email is in the `admin_emails` list
2. Check if you're the first user in the system
3. Verify the `determine_initial_role()` function is working

## 📋 **Quick Reference**

### **Admin Commands:**
```bash
# Check current users
python3 setup_admin.py

# Make user admin
python3 make_admin.py user@example.com

# Check database directly
psql -h <host> -U <user> -d <database>
SELECT email, role FROM users;
```

### **Admin URLs:**
- **Admin Dashboard:** `http://localhost:3000/admin`
- **Agent Dashboard:** `http://localhost:3000/agent`
- **API Docs:** `http://localhost:8000/docs`

### **Current Admin Account:**
- **Email:** `chinmaydhama25@gmail.com`
- **Name:** chinmay dhama
- **Role:** admin
- **Created:** 2025-07-27 13:09:52

---

**💡 Tip:** Always test admin functionality after making changes to ensure everything works correctly! 