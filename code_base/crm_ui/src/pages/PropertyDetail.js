import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import EnquiryForm from '../components/EnquiryForm';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

function PropertyDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Sample property images for different property types
  const propertyImages = {
    default: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop'
    ],
    penthouse: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200&h=800&fit=crop'
    ],
    villa: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop'
    ]
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      console.log('🔍 Fetching property details for ID:', id);
      const response = await fetch(API_ENDPOINTS.PROPERTY_DETAIL(id));
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Property data received:', data);
        setProperty(data);
        
        // Track property detail view
        if (window.clickTracker) {
          window.clickTracker.trackInteraction('property_detail_view', {
            propertyId: id,
            propertyLabel: data.label
          });
        }
      } else {
        console.error('Failed to fetch property:', response.status);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleContactClick = () => {
    // Track contact button click
    if (window.clickTracker) {
      window.clickTracker.trackInteraction('contact_click', {
        propertyId: id,
        propertyLabel: property?.label,
        action: 'contact_from_detail'
      });
    }
    // You can add actual contact logic here
    alert('Contact functionality would be implemented here');
  };

  const handleEnquiryClick = () => {
    // Track enquiry form open
    if (window.clickTracker) {
      window.clickTracker.trackInteraction('enquiry_form_open', {
        propertyId: id,
        propertyLabel: property?.label
      });
    }
    setShowEnquiryForm(true);
  };

  const getPropertyImages = () => {
    const propertyType = property?.property_type?.toLowerCase();
    if (propertyType?.includes('penthouse')) return propertyImages.penthouse;
    if (propertyType?.includes('villa')) return propertyImages.villa;
    return propertyImages.default;
  };

  const nextImage = () => {
    const images = getPropertyImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getPropertyImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (price) => {
    if (!price) return "Price on Request";
    return `$${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading property details...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Property Not Found</h1>
          <Link to="/properties" className="text-slate-600 hover:underline font-semibold">
            ← Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const images = getPropertyImages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            to="/properties" 
            className="inline-flex items-center text-slate-600 hover:text-slate-800 font-semibold transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Properties
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Image Gallery */}
          <div className="relative h-96 md:h-[600px] overflow-hidden">
            <img
              src={images[currentImageIndex]}
              alt={property.label}
              className="w-full h-full object-cover"
            />
            
            {/* Image Navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all duration-200 shadow-lg"
            >
              <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all duration-200 shadow-lg"
            >
              <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>

            {/* Property Type Badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                {property.property_type || 'Property'}
              </span>
            </div>

            {/* Price Badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-white text-slate-800 px-6 py-3 rounded-full text-xl font-bold shadow-lg">
                {formatPrice(property.price)}
              </span>
            </div>
          </div>

          {/* Property Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2">
                <h1 className="text-4xl font-bold text-slate-800 mb-4">{property.label}</h1>
                <p className="text-gray-600 text-xl mb-8 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {property.address}
                </p>

                {/* Property Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-slate-800">{property.beds || 0}</div>
                    <div className="text-gray-600 font-medium">Bedrooms</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-slate-800">{property.baths || 0}</div>
                    <div className="text-gray-600 font-medium">Bathrooms</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-slate-800">{property.area || 'N/A'}</div>
                    <div className="text-gray-600 font-medium">Area</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-slate-800">{property.status || 'Available'}</div>
                    <div className="text-gray-600 font-medium">Status</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">Property Overview</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {property.description || 'This exceptional property represents the pinnacle of luxury living. Meticulously designed with premium materials and finishes, it offers an unparalleled lifestyle experience. Every detail has been carefully considered to create a home that exceeds expectations and provides the perfect setting for creating lasting memories.'}
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-slate-50 rounded-2xl p-8 sticky top-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">Interested in this property?</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    This is an exceptional opportunity to own a piece of luxury real estate. 
                    Contact our team for a private viewing or to discuss your interest.
                  </p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleContactClick}
                      className="w-full bg-slate-800 text-white py-4 px-6 rounded-xl hover:bg-slate-700 transition-colors font-semibold text-lg flex items-center justify-center"
                      data-action="contact"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Contact Agent
                    </button>
                    
                    <button
                      onClick={handleEnquiryClick}
                      className="w-full bg-white border-2 border-slate-800 text-slate-800 py-4 px-6 rounded-xl hover:bg-slate-800 hover:text-white transition-all duration-200 font-semibold text-lg flex items-center justify-center"
                      data-action="enquiry-form"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Send Enquiry
                    </button>
                  </div>

                  {/* Quick Info */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h4 className="font-semibold text-slate-800 mb-4">Property Highlights</h4>
                    <ul className="space-y-3 text-sm text-gray-600">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {property.beds || 0} Bedrooms
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {property.baths || 0} Bathrooms
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {property.area || 'N/A'} Area
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 mr-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {property.property_type || 'Property'} Type
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Form Modal */}
      {showEnquiryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Send Enquiry</h2>
              <button
                onClick={() => setShowEnquiryForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <EnquiryForm 
              propertyId={id}
              onSuccess={() => {
                setShowEnquiryForm(false);
                // Track successful enquiry submission
                if (window.clickTracker) {
                  window.clickTracker.trackInteraction('enquiry_submitted', {
                    propertyId: id,
                    propertyLabel: property.label
                  });
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetail; 