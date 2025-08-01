import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const AdminDashboard = () => {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    totalLeads: 0,
    pendingProperties: 0
  });
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  

  const [newProperty, setNewProperty] = useState({
    label: '',
    description: '',
    address: '',
    area: '',
    beds: '',
    baths: '',
    price: '',
    property_type: 'residential',
    image_url: ''
  });
  const [newAgent, setNewAgent] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    bio: ''
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching dashboard data with token:', token ? 'Token exists' : 'No token');
      
      // Fetch stats
      const statsResponse = await fetch(API_ENDPOINTS.ADMIN_STATS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('📊 Stats response:', statsResponse.status);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Stats data:', statsData);
        setStats(statsData);
      } else {
        const errorText = await statsResponse.text();
        console.error('❌ Failed to fetch stats:', statsResponse.status, errorText);
      }

      // Fetch properties
      const propertiesResponse = await fetch(API_ENDPOINTS.ADMIN_PROPERTIES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('🏠 Properties response:', propertiesResponse.status);
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        console.log('🏠 Properties data:', propertiesData);
        // Handle both array and object with properties key
        const propertiesArray = Array.isArray(propertiesData) ? propertiesData : (propertiesData.properties || []);
        console.log('🏠 Setting properties:', propertiesArray.length, 'properties');
        console.log('🏠 Total count from response:', propertiesData.total_count);
        console.log('🏠 Sample property:', propertiesArray[0]);
        setProperties(propertiesArray);
      } else {
        const errorText = await propertiesResponse.text();
        console.error('❌ Failed to fetch properties:', propertiesResponse.status, errorText);
      }

      // Fetch users
      const usersResponse = await fetch(API_ENDPOINTS.ADMIN_USERS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('👥 Users response:', usersResponse.status);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('👥 Users data:', usersData);
        setUsers(usersData);
      } else {
        const errorText = await usersResponse.text();
        console.error('❌ Failed to fetch users:', usersResponse.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    fetchDashboardData();
  }, [isAdmin, navigate, fetchDashboardData]);

  // Debug modal state
  useEffect(() => {
    console.log('🔘 Modal state changed - showAddAgent:', showAddAgent);
  }, [showAddAgent]);

  // Prevent modal from closing when switching tabs
  const handleTabChange = (tabId) => {
    console.log('🔘 Tab change requested:', tabId);
    setActiveTab(tabId);
  };

  const createProperty = async (propertyData) => {
    try {
      console.log('🏗️ Creating property with data:', propertyData);
      console.log('🔑 Using token:', token ? `Token exists (${token.substring(0, 20)}...)` : 'No token');
      
      const response = await fetch(API_ENDPOINTS.ADMIN_PROPERTIES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propertyData)
      });

      console.log('📤 Property creation response:', response.status);
      console.log('📤 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Property created successfully:', result);
        setShowAddProperty(false);
        setNewProperty({
          label: '',
          description: '',
          address: '',
          area: '',
          beds: '',
          baths: '',
          price: '',
          property_type: 'residential',
          image_url: ''
        });
        fetchDashboardData(); // Refresh data
        alert('Property created successfully!');
      } else {
        const errorText = await response.text();
        console.error('❌ Property creation failed:', response.status, errorText);
        let errorMessage = 'Failed to create property';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        alert(`Failed to create property: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Error creating property:', error);
      alert('Error creating property');
    }
  };

  const assignPropertyToAgent = async (propertyId, agentId) => {
    try {
      console.log('🏗️ Assigning property:', propertyId, 'to agent:', agentId);
      
      const response = await fetch(API_ENDPOINTS.ADMIN_PROPERTY_ASSIGN(propertyId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ agent_id: agentId })
      });

      console.log('📤 Assignment response:', response.status);
      
      if (response.ok) {
        console.log('✅ Property assigned successfully');
        // Refresh data to get updated agent names
        console.log('🔄 Refreshing dashboard data after assignment...');
        await fetchDashboardData();
        console.log('✅ Dashboard data refreshed after assignment');
        alert('Property assigned successfully!');
      } else {
        const errorText = await response.text();
        console.error('❌ Assignment failed:', response.status, errorText);
        let errorMessage = 'Failed to assign property';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        alert(`Failed to assign property: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Error assigning property:', error);
      alert('Error assigning property');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_USER_ROLE(userId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
        alert('User role updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update user role: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
    }
  };

  const createAgent = async (agentData) => {
          try {
        const response = await fetch(API_ENDPOINTS.ADMIN_USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...agentData,
          role: 'agent'
        })
      });

                if (response.ok) {
            await response.json();
        setShowAddAgent(false);
        setNewAgent({
          name: '',
          email: '',
          phone: '',
          specialization: '',
          bio: ''
        });
        fetchDashboardData(); // Refresh data
        alert('Agent created successfully!');
                } else {
            const errorText = await response.text();
            let errorMessage = 'Failed to create agent';
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
              errorMessage = errorText || errorMessage;
            }
            alert(`Failed to create agent: ${errorMessage}`);
          }
        } catch (error) {
          alert('Error creating agent');
        }
  };

  const handleAddAgent = (e) => {
    e.preventDefault();
    createAgent(newAgent);
  };

  const handleAddProperty = (e) => {
    e.preventDefault();
    const propertyData = {
      ...newProperty,
      beds: parseInt(newProperty.beds) || 0,
      baths: parseInt(newProperty.baths) || 0,
      price: parseFloat(newProperty.price) || 0
    };
    createProperty(propertyData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'properties', name: 'Properties', icon: '🏠' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">🏠</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Properties</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalProperties}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">👥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">📞</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalLeads}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">⏳</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Properties</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingProperties}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleTabChange('properties')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="mr-2">➕</span>
                    Add Property
                  </button>
                  <button
                    onClick={() => handleTabChange('users')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <span className="mr-2">👤</span>
                    Manage Users
                  </button>
                  <button
                    onClick={() => handleTabChange('analytics')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                  >
                    <span className="mr-2">📊</span>
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Properties Management</h2>
              <button 
                onClick={() => setShowAddProperty(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <span className="mr-2">➕</span>
                Add Property
              </button>
            </div>

            {/* Add Property Modal */}
            {showAddProperty && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Add New Property</h3>
                      <button
                        onClick={() => setShowAddProperty(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <span className="text-2xl">×</span>
                      </button>
                    </div>
                    <form onSubmit={handleAddProperty} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Property Label *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g., Luxury Downtown Penthouse"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={newProperty.label}
                            onChange={(e) => setNewProperty({...newProperty, label: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                          <select
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={newProperty.property_type}
                            onChange={(e) => setNewProperty({...newProperty, property_type: e.target.value})}
                          >
                            <option value="">Select Property Type</option>
                            <option value="Single Family">Single Family</option>
                            <option value="Condo">Condo</option>
                            <option value="Townhouse">Townhouse</option>
                            <option value="Penthouse">Penthouse</option>
                            <option value="Loft">Loft</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Estate">Estate</option>
                            <option value="Villa">Villa</option>
                            <option value="Beach House">Beach House</option>
                            <option value="Cottage">Cottage</option>
                            <option value="Ranch">Ranch</option>
                            <option value="Victorian">Victorian</option>
                            <option value="Modern">Modern</option>
                            <option value="Executive">Executive</option>
                            <option value="Farmhouse">Farmhouse</option>
                            <option value="Duplex">Duplex</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                        <input
                          type="text"
                          required
                          placeholder="Full property address"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={newProperty.address}
                          onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          rows="4"
                          placeholder="Detailed property description including features, amenities, and highlights..."
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={newProperty.description}
                          onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={newProperty.beds}
                            onChange={(e) => setNewProperty({...newProperty, beds: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="0"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={newProperty.baths}
                            onChange={(e) => setNewProperty({...newProperty, baths: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Area (sq ft)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={newProperty.area}
                            onChange={(e) => setNewProperty({...newProperty, area: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={newProperty.price}
                            onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                        <input
                          type="url"
                          placeholder="https://example.com/property-image.jpg"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={newProperty.image_url}
                          onChange={(e) => setNewProperty({...newProperty, image_url: e.target.value})}
                        />
                        <p className="mt-1 text-xs text-gray-500">Optional: Add a high-quality image URL for the property</p>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddProperty(false)}
                          className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Property
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Add Agent Modal */}
            {showAddAgent && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Agent</h3>
                    

                    
                    <form onSubmit={handleAddAgent} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={newAgent.name}
                          onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={newAgent.email}
                          onChange={(e) => setNewAgent({...newAgent, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={newAgent.phone}
                          onChange={(e) => setNewAgent({...newAgent, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Specialization</label>
                        <select
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={newAgent.specialization}
                          onChange={(e) => setNewAgent({...newAgent, specialization: e.target.value})}
                        >
                          <option value="">Select Specialization</option>
                          <option value="residential">Residential</option>
                          <option value="commercial">Commercial</option>
                          <option value="luxury">Luxury</option>
                          <option value="investment">Investment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          rows="3"
                          value={newAgent.bio}
                          onChange={(e) => setNewAgent({...newAgent, bio: e.target.value})}
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddAgent(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                          Add Agent
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">All Properties ({properties.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {properties.length > 0 ? (
                  properties.map((property) => (
                    <div key={property.property_id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Property Image */}
                      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                        {property.image_url ? (
                          <img 
                            className="h-full w-full object-cover" 
                            src={property.image_url} 
                            alt={property.label}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gray-300 flex items-center justify-center" style={{display: property.image_url ? 'none' : 'flex'}}>
                          <span className="text-gray-600 text-4xl">🏠</span>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            property.status === 'active' ? 'bg-green-100 text-green-800' :
                            property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {property.status}
                          </span>
                        </div>
                        
                        {/* Price Badge */}
                        {property.price && (
                          <div className="absolute bottom-2 left-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-white">
                              ${property.price.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Property Details */}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.label}</h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{property.address}</p>
                        
                        {/* Property Stats */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <span className="mr-1">🛏️</span>
                              {property.beds} beds
                            </span>
                            <span className="flex items-center">
                              <span className="mr-1">🚿</span>
                              {property.baths} baths
                            </span>
                            <span className="flex items-center">
                              <span className="mr-1">📏</span>
                              {property.area} sq ft
                            </span>
                          </div>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {property.property_type}
                          </span>
                        </div>
                        
                        {/* Description */}
                        {property.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {property.description}
                          </p>
                        )}
                        
                        {/* Agent Assignment */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Agent:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {property.agent_name || 'Unassigned'}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              (ID: {property.assigned_agent_id || 'None'})
                            </span>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                              Edit
                            </button>
                            <select
                              value={property.assigned_agent_id || ''}
                              onChange={(e) => {
                                const agentId = e.target.value;
                                console.log('🔄 Agent assignment changed:', agentId, 'for property:', property.property_id);
                                if (agentId) {
                                  assignPropertyToAgent(property.property_id, parseInt(agentId));
                                }
                              }}
                              className="text-xs border border-gray-300 rounded-md px-2 py-1"
                            >
                              <option value="">Assign Agent</option>
                              {users.filter(user => user.role === 'agent').map(agent => (
                                <option key={agent.user_id} value={agent.user_id}>
                                  {agent.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">
                      <span className="text-4xl mb-4 block">🏠</span>
                      <p className="text-lg font-medium">No properties found</p>
                      <p className="text-sm">Add your first property to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <button
                type="button"
                onClick={() => setShowAddAgent(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-2">➕</span>
                Add New Agent
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <li key={user.user_id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profile_picture ? (
                              <img className="h-10 w-10 rounded-full" src={user.profile_picture} alt="" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600">👤</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-sm text-gray-500">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                          <div className="flex space-x-2">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.user_id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-md px-2 py-1"
                            >
                              <option value="agent">Agent</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-6 py-4 text-gray-500">No users found.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            {console.log('📊 Analytics - Stats:', stats)}
            {console.log('📊 Analytics - Properties:', properties)}
            
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">📊</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Properties</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalProperties}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">👥</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">📞</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalLeads}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">⏳</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Properties</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingProperties}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Type Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Property Type Distribution</h3>
              <div className="space-y-3">
                {Object.entries(properties.reduce((acc, prop) => {
                  const type = prop.property_type || 'Unknown';
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {})).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                    <span className="text-sm text-gray-500">{count} properties</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {properties.slice(0, 5).map((property) => (
                  <div key={property.property_id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">🏠</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {property.label}
                      </p>
                      <p className="text-sm text-gray-500">
                        Added {new Date(property.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        property.status === 'active' ? 'bg-green-100 text-green-800' :
                        property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {property.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 