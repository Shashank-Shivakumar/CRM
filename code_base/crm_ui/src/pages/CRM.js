import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

function CRM() {
  const { user, token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageType, setMessageType] = useState('email'); // 'email' or 'sms'
  const [messageData, setMessageData] = useState({
    subject: '',
    body: '',
    template: '',
    recipients: []
  });
  const [emailTemplates] = useState([
    { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to Our Real Estate Services', body: 'Hi {{name}},\n\nThank you for your interest in our properties. We\'re excited to help you find your perfect home!\n\nBest regards,\nYour Real Estate Team' },
    { id: 'followup', name: 'Follow-up Email', subject: 'Following up on your property interest', body: 'Hi {{name}},\n\nI wanted to follow up on your interest in our properties. Do you have any questions or would you like to schedule a viewing?\n\nBest regards,\nYour Real Estate Team' },
    { id: 'custom', name: 'Custom Email', subject: '', body: '' }
  ]);
  const [smsTemplates] = useState([
    { id: 'welcome', name: 'Welcome SMS', body: 'Hi {{name}}, thanks for your interest! We\'ll be in touch soon.' },
    { id: 'followup', name: 'Follow-up SMS', body: 'Hi {{name}}, following up on your property interest. Any questions?' },
    { id: 'custom', name: 'Custom SMS', body: '' }
  ]);



  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use different endpoints based on user role
      let endpoint;
      let headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        if (user?.role === 'agent') {
          // For agents, use /leads endpoint but we'll filter by assigned_agent_id
          endpoint = API_ENDPOINTS.LEADS;
        } else if (user?.role === 'admin') {
          // For admins, use /leads endpoint to see all leads
          endpoint = API_ENDPOINTS.LEADS;
        } else {
          endpoint = API_ENDPOINTS.LEADS;
        }
      } else {
        endpoint = API_ENDPOINTS.LEADS;
      }
      
      const response = await fetch(endpoint, { headers });
      if (response.ok) {
        const data = await response.json();
        
        // Transform data based on endpoint response format
        let leadsData = [];
        if (Array.isArray(data)) {
          // /leads endpoint returns array directly
          if (user?.role === 'agent') {
            // For agents, we need to filter leads that are assigned to them
            // Since /leads doesn't have assigned_agent_id, we'll show all leads for now
            // TODO: Modify /leads endpoint to support agent filtering
            leadsData = data;
          } else {
            // For admins, show all leads
            leadsData = data;
          }
        } else {
          // Fallback for other endpoints
          leadsData = Array.isArray(data) ? data : [];
        }
        
        // Transform backend data to match the requested column structure
        const transformedLeads = leadsData.map((lead, index) => ({
          lead_id: lead.lead_id || lead.user_id,
          customer_name: lead.name || lead.customer_name || lead.email || 'Unknown',
          pipeline: 'Buyer',
          owner: 'New Leads',
          agent: user?.name || 'Agent',
          contact_info: {
            email: lead.email,
            phone: lead.phone || 'N/A'
          },
          lead_score: lead.lead_score || 0,
          last_touch: formatLastTouch(lead.created_at || lead.created_date),
          communications: 'Manual Emails',
          inquiries: formatLastTouch(lead.created_at || lead.created_date),
          activities: String(index + 1).padStart(3, '0'),
          smart_plan: lead.property_label || lead.property_interested || 'N/A',
          alert: 'General Inquiry',
          tasks: '0',
          tags: 'None',
          reg: 'None',
          lender: 'None',
          last_visit: formatLastTouch(lead.created_at || lead.created_date),
          revaluate_score: 'Website',
          assistant: 'None',
          status: lead.status || 'new',
          created_date: lead.created_at || lead.created_date,
          lead_comments: lead.message || lead.lead_comments
        }));
        setLeads(transformedLeads);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to load leads. Please try again.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Call fetchLeads when component mounts or dependencies change
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Recalculate stats whenever leads change
  useEffect(() => {
    if (leads.length > 0) {
      // Calculate stats inline to avoid dependency issues
      const totalLeads = leads.length;
      const newLeads = leads.filter(lead => lead.status === 'new').length;
      const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length;
      const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
      const averageScore = leads.length > 0 
        ? Math.round(leads.reduce((sum, lead) => sum + (lead.lead_score || 0), 0) / leads.length)
        : 0;

      setStats({
        total_leads: totalLeads,
        new_leads: newLeads,
        qualified_leads: qualifiedLeads,
        converted_leads: convertedLeads,
        average_score: averageScore
      });
    }
  }, [leads]);





  const formatLastTouch = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleViewLead = async (leadId) => {
    try {
      const response = await fetch(API_ENDPOINTS.LEAD_DETAIL(leadId));
      if (response.ok) {
        const leadData = await response.json();
        setSelectedLead(leadData);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
      alert('Failed to load lead details');
    }
  };

  const handleContactLead = (lead) => {
    setSelectedLead(lead);
    setShowContactModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedLead) return;

    try {
              const response = await fetch(API_ENDPOINTS.LEAD_STATUS(selectedLead.lead_id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusUpdate),
      });

      if (response.ok) {
        setShowStatusModal(false);
        setStatusUpdate({ status: '', notes: '' });
        fetchLeads(); // Refresh the leads list
        alert('Lead status updated successfully!');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Failed to update lead status');
    }
  };

  // Row editing functions
  const startEditing = (lead) => {
    setEditingLead(lead.lead_id);
    setEditForm({
      customer_name: lead.customer_name,
      pipeline: lead.pipeline,
      owner: lead.owner,
      agent: lead.agent,
      email: lead.contact_info?.email || lead.email,
      phone: lead.contact_info?.phone || lead.phone,
      lead_score: lead.lead_score,
      communications: lead.communications,
      smart_plan: lead.smart_plan,
      alert: lead.alert,
      tasks: lead.tasks,
      tags: lead.tags,
      reg: lead.reg,
      lender: lead.lender,
      revaluate_score: lead.revaluate_score,
      assistant: lead.assistant,
      status: lead.status
    });
  };

  const cancelEditing = () => {
    setEditingLead(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingLead) return;

    try {
      // Update the local state first for immediate UI feedback
      const updatedLeads = leads.map(lead => {
        if (lead.lead_id === editingLead) {
          return {
            ...lead,
            customer_name: editForm.customer_name,
            pipeline: editForm.pipeline,
            owner: editForm.owner,
            agent: editForm.agent,
            contact_info: {
              email: editForm.email,
              phone: editForm.phone
            },
            lead_score: parseInt(editForm.lead_score) || 0,
            communications: editForm.communications,
            smart_plan: editForm.smart_plan,
            alert: editForm.alert,
            tasks: editForm.tasks,
            tags: editForm.tags,
            reg: editForm.reg,
            lender: editForm.lender,
            revaluate_score: editForm.revaluate_score,
            assistant: editForm.assistant,
            status: editForm.status
          };
        }
        return lead;
      });

      setLeads(updatedLeads);
      setEditingLead(null);
      setEditForm({});

      // Here you would typically make an API call to save the changes
      // For now, we'll just show a success message
      alert('Lead updated successfully!');
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead');
    }
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads([]);
      setSelectAll(false);
    } else {
      setSelectedLeads(leads.map(lead => lead.lead_id));
      setSelectAll(true);
    }
  };

  const handleBulkEdit = () => {
    if (selectedLeads.length === 0) {
      alert('Please select at least one lead to edit');
      return;
    }
    
    // Show bulk edit options
    const status = prompt(`Enter new status for ${selectedLeads.length} selected leads (new/qualified/converted):`);
    if (status && ['new', 'qualified', 'converted'].includes(status.toLowerCase())) {
      // For now, we'll just show what would be updated
      alert(`Would update ${selectedLeads.length} leads to status: ${status}`);
      // TODO: Implement actual bulk status update API endpoint
    } else if (status !== null) {
      alert('Invalid status. Please use: new, qualified, or converted');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select at least one lead to delete');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} selected leads?`)) {
      try {
        const response = await fetch(API_ENDPOINTS.LEAD_BULK_DELETE, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lead_ids: selectedLeads
          })
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Successfully deleted ${result.deleted_count} leads`);
          
          // Clear selection and refresh leads
          setSelectedLeads([]);
          setSelectAll(false);
          fetchLeads();
        } else {
          const error = await response.json();
          alert(`Error deleting leads: ${error.detail}`);
        }
      } catch (error) {
        console.error('Error deleting leads:', error);
        alert('Error deleting leads. Please try again.');
      }
    }
  };

  const handleSendMessage = (type, lead = null) => {
    setMessageType(type);
    if (lead) {
      // Single lead messaging
      setMessageData({
        subject: '',
        body: '',
        template: '',
        recipients: [lead]
      });
    } else {
      // Bulk messaging for selected leads
      const selectedLeadObjects = leads.filter(l => selectedLeads.includes(l.lead_id));
      setMessageData({
        subject: '',
        body: '',
        template: '',
        recipients: selectedLeadObjects
      });
    }
    setShowMessageModal(true);
  };

  const handleTemplateChange = (templateId) => {
    const templates = messageType === 'email' ? emailTemplates : smsTemplates;
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      setMessageData(prev => ({
        ...prev,
        template: templateId,
        subject: template.subject || '',
        body: template.body || ''
      }));
    }
  };

  const sendMessage = async () => {
    try {
              const response = await fetch(API_ENDPOINTS.LEAD_SEND_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: messageType,
          recipients: messageData.recipients.map(r => r.lead_id),
          subject: messageData.subject,
          body: messageData.body,
          template: messageData.template
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully sent ${result.sent_count} ${messageType}${result.sent_count > 1 ? 's' : ''}`);
        
        if (result.failed_count > 0) {
          alert(`${result.failed_count} message${result.failed_count > 1 ? 's' : ''} failed to send`);
        }
        
        setShowMessageModal(false);
        setMessageData({ subject: '', body: '', template: '', recipients: [] });
      } else {
        const error = await response.json();
        alert(`Error sending messages: ${error.detail}`);
      }
      
    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Error sending messages. Please try again.');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600 font-bold';
    if (score >= 40) return 'text-orange-600 font-bold';
    return 'text-red-600 font-bold';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Hot Lead';
    if (score >= 60) return 'Warm Lead';
    if (score >= 40) return 'Cool Lead';
    return 'Cold Lead';
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 40) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-green-100 text-green-800 border-green-200';
      case 'qualified': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'converted': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': 
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
          </svg>
        );
      case 'qualified': 
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        );
      case 'converted': 
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
          </svg>
        );
      default: 
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"/>
          </svg>
        );
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'New Lead';
      case 'qualified': return 'Qualified';
      case 'converted': return 'Converted';
      default: return status || 'New Lead';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600', 
      'from-purple-500 to-pink-600',
      'from-orange-500 to-red-600',
      'from-indigo-500 to-blue-600',
      'from-pink-500 to-rose-600'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading CRM dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header with Company Branding */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Zero2one.ai Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Zero2one.ai</h1>
                  <p className="text-sm text-gray-600">AI-Powered CRM Solutions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <h2 className="text-xl font-bold text-slate-800">Onest Realestate</h2>
                <p className="text-sm text-gray-600">Premium Real Estate Solutions</p>
              </div>
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <span>📞 +1 (555) 123-4567</span>
                <span>📧 info@onestrealestate.com</span>
              </div>
              {/* Back to Properties Button */}
              <Link
                to="/"
                className="bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back to Properties</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-800">CRM Dashboard</h1>
            <button
              onClick={() => fetchLeads()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </div>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Total Leads</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.total_leads || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">New Leads</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.new_leads || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Qualified</h3>
                  <p className="text-3xl font-bold text-yellow-600">{stats.qualified_leads || 0}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Converted</h3>
                  <p className="text-3xl font-bold text-purple-600">{stats.converted_leads || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Avg Score</h3>
                  <p className="text-3xl font-bold text-indigo-600">{stats.average_score || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Leads Table with Modern Design */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">All Leads ({leads.length})</h2>
                {selectedLeads.length > 0 && (
                  <div className="flex space-x-3">
                    <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                      {selectedLeads.length} selected
                    </span>
                    <button
                      onClick={handleBulkEdit}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Bulk Edit
                    </button>
                    <button
                      onClick={() => handleSendMessage('email')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Bulk Email</span>
                    </button>
                    <button
                      onClick={() => handleSendMessage('sms')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Bulk SMS</span>
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Bulk Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {leads.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first lead.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="border border-gray-200 px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Pipeline</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Owner</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Agent</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact Info</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Lead Score</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Touch</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Communications</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Inquiries</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Activities</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Smart Plan</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Alert</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tasks</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tags</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Reg</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Lender</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Visit</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Revaluate Score</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Assistant</th>
                      <th className="border border-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {leads.map((lead) => (
                      <tr key={lead.lead_id} className="hover:bg-blue-50 transition-all duration-200 border-b border-gray-100 hover:shadow-sm hover:transform hover:scale-[1.001]">
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.lead_id)}
                            onChange={() => handleSelectLead(lead.lead_id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.customer_name}
                              onChange={(e) => handleEditChange('customer_name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <div className="flex items-center">
                              <div className={`w-8 h-8 bg-gradient-to-r ${getAvatarColor(lead.customer_name)} rounded-full flex items-center justify-center text-white text-sm font-bold mr-3`}>
                                {getInitials(lead.customer_name)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{lead.customer_name}</div>
                                <div className="text-sm text-gray-500">{lead.contact_info?.email || lead.email}</div>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <select
                              value={editForm.status}
                              onChange={(e) => handleEditChange('status', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="new">New Lead</option>
                              <option value="qualified">Qualified</option>
                              <option value="converted">Converted</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                              {getStatusIcon(lead.status)}
                              {getStatusDisplayName(lead.status)}
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <select
                              value={editForm.pipeline}
                              onChange={(e) => handleEditChange('pipeline', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="Buyer">Buyer</option>
                              <option value="Seller">Seller</option>
                              <option value="Both">Both</option>
                            </select>
                          ) : (
                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
                              lead.pipeline === 'Buyer' ? 'bg-green-100 text-green-800 border-green-200' :
                              lead.pipeline === 'Seller' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                              {lead.pipeline}
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.owner}
                              onChange={(e) => handleEditChange('owner', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{lead.owner}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.agent}
                              onChange={(e) => handleEditChange('agent', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{lead.agent}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <div className="space-y-1">
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => handleEditChange('email', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Email"
                              />
                              <input
                                type="text"
                                value={editForm.phone}
                                onChange={(e) => handleEditChange('phone', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Phone"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm text-gray-900">{lead.contact_info?.phone || lead.phone || 'N/A'}</div>
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="number"
                              value={editForm.lead_score}
                              onChange={(e) => handleEditChange('lead_score', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              max="100"
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${getScoreBadgeClass(lead.lead_score)}`}>
                                {getScoreLabel(lead.lead_score)}
                              </span>
                              <span className={`text-sm font-bold ${getScoreColor(lead.lead_score)}`}>
                                {lead.lead_score || 0}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.last_touch}</td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <select
                              value={editForm.communications}
                              onChange={(e) => handleEditChange('communications', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="Manual Emails">Manual Emails</option>
                              <option value="Manual Texts">Manual Texts</option>
                              <option value="Smart Plan Auto Emails">Smart Plan Auto Emails</option>
                              <option value="AI Auto Texts">AI Auto Texts</option>
                              <option value="Property Alerts">Property Alerts</option>
                            </select>
                          ) : (
                            <span className="text-sm text-gray-900">{lead.communications}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.inquiries}</td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.activities}</td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.smart_plan}
                              onChange={(e) => handleEditChange('smart_plan', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{lead.smart_plan}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.alert}
                              onChange={(e) => handleEditChange('alert', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{lead.alert}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.tasks}
                              onChange={(e) => handleEditChange('tasks', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{lead.tasks}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.tags}
                              onChange={(e) => handleEditChange('tags', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{lead.tags}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.reg}
                              onChange={(e) => handleEditChange('reg', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{lead.reg}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.lender}
                              onChange={(e) => handleEditChange('lender', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{lead.lender}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.last_visit}</td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <select
                              value={editForm.revaluate_score}
                              onChange={(e) => handleEditChange('revaluate_score', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="Website">Website</option>
                              <option value="Other">Other</option>
                              <option value="Referral">Referral</option>
                            </select>
                          ) : (
                            <span className="text-sm text-gray-900">{lead.revaluate_score}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap">
                          {editingLead === lead.lead_id ? (
                            <input
                              type="text"
                              value={editForm.assistant}
                              onChange={(e) => handleEditChange('assistant', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-500">{lead.assistant}</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingLead === lead.lead_id ? (
                            <div className="flex space-x-1">
                              <button
                                onClick={saveEdit}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Save Changes"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Cancel Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => startEditing(lead)}
                                className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Edit Lead"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleViewLead(lead.lead_id)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="View Lead"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleContactLead(lead)}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Contact Lead"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setShowStatusModal(true);
                                }}
                                className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Update Status"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleSendMessage('email', lead)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Send Email"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleSendMessage('sms', lead)}
                                className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                title="Send SMS"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Lead Modal */}
      {showViewModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Lead Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLead.customer_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLead.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLead.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lead Score</label>
                  <p className={`mt-1 text-sm ${getScoreColor(selectedLead.lead_score)}`}>
                    {selectedLead.lead_score || 0} - {getScoreLabel(selectedLead.lead_score || 0)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedLead.created_date ? new Date(selectedLead.created_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              {selectedLead.lead_comments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comments</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLead.lead_comments}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Lead Modal */}
      {showContactModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Contact Lead</h2>
              <button onClick={() => setShowContactModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLead.customer_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLead.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLead.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead Score</label>
                <p className={`mt-1 text-sm ${getScoreColor(selectedLead.lead_score)}`}>
                  {selectedLead.lead_score || 0} - {getScoreLabel(selectedLead.lead_score || 0)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Here you would implement actual contact functionality
                  alert('Contact functionality would be implemented here');
                  setShowContactModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Contact Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Update Lead Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Lead</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLead.customer_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="new">New</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate({ ...statusUpdate, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add notes about this lead..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Send {messageType === 'email' ? 'Email' : 'SMS'} 
                {messageData.recipients.length > 1 && ` (${messageData.recipients.length} recipients)`}
              </h2>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Template
                </label>
                <select
                  value={messageData.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a template...</option>
                  {(messageType === 'email' ? emailTemplates : smsTemplates).map(template => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients ({messageData.recipients.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                  {messageData.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <div>
                        <span className="font-medium">{recipient.customer_name}</span>
                        <span className="text-gray-500 ml-2">
                          ({messageType === 'email' ? recipient.email : recipient.phone || 'No phone'})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Subject (only for emails) */}
              {messageType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={messageData.subject}
                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email subject..."
                  />
                </div>
              )}

              {/* Message Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageData.body}
                  onChange={(e) => setMessageData({ ...messageData, body: e.target.value })}
                  rows={messageType === 'email' ? 8 : 4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter your ${messageType === 'email' ? 'email' : 'SMS'} message...`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{{name}}'} to personalize the message with the recipient's name
                </p>
              </div>

              {/* Preview */}
              {messageData.body && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview (for first recipient)
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                    {messageType === 'email' && messageData.subject && (
                      <div className="mb-2">
                        <strong>Subject:</strong> {messageData.subject.replace(/\{\{name\}\}/g, messageData.recipients[0]?.customer_name || '{{name}}')}
                      </div>
                    )}
                    <div>
                      <strong>Message:</strong>
                      <div className="mt-1 whitespace-pre-wrap">
                        {messageData.body.replace(/\{\{name\}\}/g, messageData.recipients[0]?.customer_name || '{{name}}')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={!messageData.body || (messageType === 'email' && !messageData.subject)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send {messageType === 'email' ? 'Email' : 'SMS'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CRM; 