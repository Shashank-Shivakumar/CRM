import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { API_ENDPOINTS } from '../config/api';

// Sample property images for fallback
const propertyImages = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=500',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=500',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=500',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=500',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=500',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=500',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=500'
];

function Properties() {
  const { user, token } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  const fetchProperties = async () => {
    try {
      console.log('🔍 Fetching properties...');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(API_ENDPOINTS.PROPERTIES, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Properties loaded:', data.length);
        setProperties(data);
      } else {
        console.error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [token]);

  const getFilteredAndSortedProperties = () => {
    let filtered = properties;

    // Debug: Log all property types
    console.log('🔍 All property types in database:', properties.map(p => p.property_type).filter(Boolean));

    // Apply filter
    if (filter !== 'all') {
      console.log('🔍 Filtering by:', filter);
      filtered = properties.filter(property => {
        const propertyType = property.property_type;
        const filterType = filter;
        const matches = propertyType === filterType;
        console.log(`🔍 Property: ${property.label}, Type: "${propertyType}", Filter: "${filterType}", Matches: ${matches}`);
        return matches;
      });
      console.log('🔍 Filtered properties count:', filtered.length);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'beds':
        filtered = [...filtered].sort((a, b) => (b.beds || 0) - (a.beds || 0));
        break;
      case 'area':
        filtered = [...filtered].sort((a, b) => (b.area || 0) - (a.area || 0));
        break;
      default:
        // Keep original order
        break;
    }

    return filtered;
  };

  const displayProperties = getFilteredAndSortedProperties();

  const handleContactClick = (property) => {
    // Track contact button click
    if (window.clickTracker) {
      window.clickTracker.trackInteraction('contact_click', {
        propertyId: property.property_id,
        propertyLabel: property.label,
        action: 'contact_from_listing'
      });
    }
    // You can add actual contact logic here
    alert('Contact functionality would be implemented here');
  };

  const formatPrice = (price) => {
    if (!price) return "Price on Request";
    return `$${price.toLocaleString()}`;
  };

  // Custom CSS for awesome animations
  const awesomeStyles = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(2deg); }
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    
    @keyframes slideIn {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    .float-animation {
      animation: float 6s ease-in-out infinite;
    }
    
    .pulse-animation {
      animation: pulse 3s ease-in-out infinite;
    }
    
    .slide-in {
      animation: slideIn 0.8s ease-out;
    }
    
    .shimmer-effect {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }
    
    .bounce-animation {
      animation: bounce 2s infinite;
    }
    
    .property-card {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .property-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }
    
    .gradient-text {
      background: linear-gradient(135deg, #3B82F6, #1E40AF, #1E3A8A);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .glass-effect {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }
    
    .neon-glow {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
    }
    
    .neon-glow:hover {
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
    }
  `;

  if (loading) {
    return (
      <>
        <style>{awesomeStyles}</style>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Loading Amazing Properties</h2>
            <p className="text-blue-500">Discovering your dream homes...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{awesomeStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse float-animation pointer-events-none"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse delay-1000 float-animation pointer-events-none"></div>
          <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-2000 float-animation pointer-events-none"></div>
        </div>
        
        {/* Header with high z-index */}
        <div className="relative z-50">
          <Header />
        </div>

        {/* Hero Section */}
        <div className="relative py-20 overflow-hidden z-10">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="mb-8">
              <div className="inline-flex items-center px-6 py-3 glass-effect rounded-full text-blue-700 text-sm font-medium mb-6 neon-glow">
                <span className="mr-2 bounce-animation">✨</span>
                Premium Real Estate Collection
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-8 gradient-text slide-in">
              Discover Your Dream Home
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed slide-in">
              Experience the future of real estate with our curated collection of exceptional properties. 
              From luxury penthouses to modern family homes, find your perfect match in prime locations.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="glass-effect rounded-2xl px-8 py-4 neon-glow hover:scale-105 transition-all duration-300">
                <span className="text-blue-700 font-bold text-lg">🏠 {displayProperties.length} Properties</span>
              </div>
              <div className="glass-effect rounded-2xl px-8 py-4 neon-glow hover:scale-105 transition-all duration-300">
                <span className="text-blue-700 font-bold text-lg">📍 Prime Locations</span>
              </div>
              <div className="glass-effect rounded-2xl px-8 py-4 neon-glow hover:scale-105 transition-all duration-300">
                <span className="text-blue-700 font-bold text-lg">💎 Luxury Options</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="container mx-auto px-4 py-12 relative z-50">
          <div className="bg-white rounded-lg p-8 mb-12 shadow-lg border border-gray-200 relative z-50">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Property Type</label>
                  <select
                    value={filter}
                    onChange={(e) => {
                      console.log('🔍 Property type filter changed:', e.target.value);
                      setFilter(e.target.value);
                    }}
                    onClick={(e) => {
                      console.log('🔍 Property type select clicked');
                    }}
                    className="bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">All Properties</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      console.log('🔍 Sort by filter changed:', e.target.value);
                      setSortBy(e.target.value);
                    }}
                    onClick={(e) => {
                      console.log('🔍 Sort by select clicked');
                    }}
                    className="bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="default">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="beds">Bedrooms</option>
                    <option value="area">Area</option>
                  </select>
                </div>
              </div>
              <div className="text-gray-700 text-lg font-semibold">
                {displayProperties.length} properties available
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayProperties.map((property, index) => (
              <div 
                key={property.property_id} 
                className="property-card bg-white rounded-3xl shadow-lg overflow-hidden neon-glow cursor-pointer group slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-action="property-view"
                data-property-id={property.property_id}
              >
                {/* Property Image with Overlay */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={property.image_url || propertyImages[index % propertyImages.length]}
                    alt={property.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = propertyImages[index % propertyImages.length];
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Property Type Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/90 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {property.property_type || 'Property'}
                    </span>
                  </div>
                  
                  {/* Stats Badge */}
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
                      {property.beds || 0} beds • {property.baths || 0} baths
                    </span>
                  </div>
                  
                  {/* Price Badge */}
                  {property.price && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg pulse-animation">
                        ${property.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">👁️</div>
                      <div className="font-semibold">View Details</div>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {property.label}
                  </h2>
                  <p className="text-gray-600 mb-4 flex items-center text-sm">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {property.address}
                  </p>
                  
                  {/* Property Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className="mr-1">🛏️</span>
                        {property.beds || 0} beds
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">🚿</span>
                        {property.baths || 0} baths
                      </span>
                      <span className="flex items-center">
                        <span className="mr-1">📏</span>
                        {property.area || 0} sq ft
                      </span>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(property.price)}
                    </span>
                  </div>
                  
                  {/* Description */}
                  {property.description && (
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {property.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Link
                      to={`/property/${property.property_id}`}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl text-center font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      data-action="property-view"
                    >
                      <span className="flex items-center justify-center">
                        <span className="mr-2">👁️</span>
                        View Details
                      </span>
                    </Link>
                    <button
                      className="flex-1 glass-effect border-2 border-blue-500 text-blue-600 py-3 px-4 rounded-xl font-semibold hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg"
                      data-action="contact"
                      onClick={() => handleContactClick(property)}
                    >
                      <span className="flex items-center justify-center">
                        <span className="mr-2">📞</span>
                        Contact
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {displayProperties.length === 0 && (
            <div className="text-center py-16">
              <div className="text-blue-600 text-xl mb-6">No properties found matching your criteria</div>
              <button
                onClick={() => setFilter('all')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg"
              >
                View All Properties
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="glass-effect border-t border-blue-200 py-12 relative z-10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600 text-sm">
              © 2024 Real Estate CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Properties; 