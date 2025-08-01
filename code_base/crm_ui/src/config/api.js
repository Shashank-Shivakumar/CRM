// API Configuration
const API_BASE_URL = window.location.hostname.includes('localhost') ? 'http://localhost:8000' : `https://${window.location.hostname.replace('web.', 'api.')}`;

export const API_ENDPOINTS = {
  // Properties
  AUTH_ME: `${API_BASE_URL}/auth/me`,
  AUTH_GOOGLE: `${API_BASE_URL}/auth/google`,
  AUTH_MICROSOFT: `${API_BASE_URL}/auth/microsoft`,
  PROPERTIES: `${API_BASE_URL}/properties`,
  PROPERTY_DETAIL: (id) => `${API_BASE_URL}/properties/${id}`,
  
  // Leads
  LEADS: `${API_BASE_URL}/leads`,
  LEAD_DETAIL: (id) => `${API_BASE_URL}/leads/${id}`,
  LEAD_STATUS: (id) => `${API_BASE_URL}/leads/${id}/status`,
  LEAD_STATS: `${API_BASE_URL}/leads/stats/summary`,
  LEAD_BULK_DELETE: `${API_BASE_URL}/leads/bulk-delete`,
  LEAD_SEND_MESSAGE: `${API_BASE_URL}/leads/send-message`,
  
  // Enquiry
  ENQUIRY: `${API_BASE_URL}/enquiry`,
  
  // Tracking
  TRACK_INTERACTION: `${API_BASE_URL}/track-interaction`,
  
  // Agent endpoints
  AGENT_STATS: `${API_BASE_URL}/agent/stats`,
  AGENT_PROPERTIES: `${API_BASE_URL}/agent/properties`,
  AGENT_LEADS: `${API_BASE_URL}/agent/leads`,
  
  // Admin endpoints
  ADMIN_STATS: `${API_BASE_URL}/admin/stats`,
  ADMIN_PROPERTIES: `${API_BASE_URL}/admin/properties`,
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,
  ADMIN_PROPERTY_ASSIGN: (propertyId) => `${API_BASE_URL}/admin/properties/${propertyId}/assign`,
  ADMIN_USER_ROLE: (userId) => `${API_BASE_URL}/admin/users/${userId}/role`,
};

export default API_BASE_URL; 