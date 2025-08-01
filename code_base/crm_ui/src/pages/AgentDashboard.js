import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const AgentDashboard = () => {
  const { user, token, isAgent } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalLeads: 0,
    pendingLeads: 0,
    conversionRate: 0
  });
  const [properties, setProperties] = useState([]);
  const [leads, setLeads] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAgent()) {
      navigate('/dashboard');
      return;
    }
    fetchDashboardData();
  }, [isAgent, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 AgentDashboard: Fetching data for agent:', user?.user_id);
      
      // Fetch agent stats
      const statsResponse = await fetch(API_ENDPOINTS.AGENT_STATS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Agent stats:', statsData);
        setStats(statsData);
      } else {
        console.error('❌ Failed to fetch agent stats:', statsResponse.status);
      }
      
      // Fetch agent properties using agent-specific endpoint
      const propertiesResponse = await fetch(API_ENDPOINTS.AGENT_PROPERTIES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        console.log('📋 Agent properties:', propertiesData);
        setProperties(propertiesData.properties || []);
      } else {
        console.error('❌ Failed to fetch agent properties:', propertiesResponse.status);
      }

      // Fetch agent leads using agent-specific endpoint
      const leadsResponse = await fetch(API_ENDPOINTS.AGENT_LEADS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        console.log('📋 Agent leads:', leadsData);
        setLeads(leadsData.leads || []);
      } else {
        console.error('❌ Failed to fetch agent leads:', leadsResponse.status);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async (propertyData) => {
    try {
      const response = await fetch(API_ENDPOINTS.AGENT_PROPERTIES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propertyData)
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
        alert('Property created successfully! Pending admin approval.');
      } else {
        alert('Failed to create property');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Error creating property');
    }
  };

  const createLead = async (leadData) => {
    try {
      const response = await fetch(API_ENDPOINTS.AGENT_LEADS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
        alert('Lead created successfully!');
      } else {
        alert('Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Error creating lead');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Agent
              </span>
              {profile && (
                <a
                  href={`/agent/${profile.public_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200"
                >
                  <span className="mr-1">🌐</span>
                  My Public Page
                </a>
              )}
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
              { id: 'users', name: 'Leads', icon: '📞' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                        <dt className="text-sm font-medium text-gray-500 truncate">My Properties</dt>
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
                      <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">⏳</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Leads</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.pendingLeads}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-lg">📈</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.conversionRate}%</dd>
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
                    onClick={() => setActiveTab('properties')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <span className="mr-2">➕</span>
                    Add Property
                  </button>
                  <button
                    onClick={() => setActiveTab('leads')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <span className="mr-2">📞</span>
                    Add Lead
                  </button>


                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {properties.slice(0, 3).map((property) => (
                    <div key={property.property_id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">🏠</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Property "{property.label}" updated
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(property.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {leads.slice(0, 3).map((lead) => (
                    <div key={lead.lead_id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">📞</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          New lead from {lead.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
              <button 
                onClick={() => {/* TODO: Open add property modal */}}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <span className="mr-2">➕</span>
                Add Property
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {properties.map((property) => (
                  <li key={property.property_id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600">🏠</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{property.label}</div>
                          <div className="text-sm text-gray-500">{property.address}</div>
                          <div className="text-sm text-gray-500">
                            {property.beds} beds, {property.baths} baths • {property.area}
                          </div>
                          {property.price && (
                            <div className="text-sm font-medium text-green-600">
                              ${property.price.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          property.status === 'active' ? 'bg-green-100 text-green-800' :
                          property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {property.status}
                        </span>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                            Edit
                          </button>
                          <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Leads</h2>
              <button 
                onClick={() => {/* TODO: Open add lead modal */}}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <span className="mr-2">➕</span>
                Add Lead
              </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <li key={lead.lead_id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600">👤</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          {lead.phone && (
                            <div className="text-sm text-gray-500">{lead.phone}</div>
                          )}
                          {lead.property_label && (
                            <div className="text-sm text-blue-600">Interested in: {lead.property_label}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status}
                        </span>
                        <div className="text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                            Contact
                          </button>
                          <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                            Update Status
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            
            {/* Property Type Distribution */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Property Type Distribution</h3>
                <div className="space-y-4">
                  {Object.entries(
                    properties.reduce((acc, property) => {
                      const type = property.property_type || 'Other';
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{type}</span>
                      <span className="text-sm text-gray-500">{count} properties</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {properties.slice(0, 3).map((property) => (
                    <div key={property.property_id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">🏠</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Property "{property.label}" updated
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(property.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {leads.slice(0, 3).map((lead) => (
                    <div key={lead.lead_id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm">📞</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          New lead from {lead.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AgentDashboard; 