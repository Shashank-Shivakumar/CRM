// Click Tracking Utility for Real Estate CRM
// Tracks user interactions and sends data to backend for lead scoring
import { API_ENDPOINTS } from '../config/api';

class ClickTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.interactions = [];
        this.isTracking = false;
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Start tracking
    start() {
        if (this.isTracking) return;
        this.isTracking = true;
        this.setupEventListeners();
        console.log('Click tracking started with session:', this.sessionId);
    }

    // Stop tracking
    stop() {
        this.isTracking = false;
        this.removeEventListeners();
    }

    // Setup event listeners for key interactions
    setupEventListeners() {
        // Track property view clicks
        document.addEventListener('click', (e) => {
            if (!this.isTracking) return;

            const target = e.target;
            
            // Property detail view
            if (target.closest('[data-action="property-view"]') || 
                target.closest('.property-card') ||
                target.closest('[href*="/property/"]')) {
                this.trackInteraction('property_view', {
                    element: target.tagName,
                    page: window.location.pathname
                });
            }

            // Contact button clicks
            if (target.closest('[data-action="contact"]') || 
                target.textContent.toLowerCase().includes('contact')) {
                this.trackInteraction('contact_click', {
                    element: target.tagName,
                    page: window.location.pathname
                });
            }

            // Enquiry form interactions
            if (target.closest('[data-action="enquiry-form"]') ||
                target.closest('form') ||
                target.type === 'submit') {
                this.trackInteraction('enquiry_form_open', {
                    element: target.tagName,
                    page: window.location.pathname
                });
            }

            // Phone number clicks
            if (target.href && target.href.startsWith('tel:')) {
                this.trackInteraction('phone_click', {
                    element: target.tagName,
                    phone: target.href.replace('tel:', ''),
                    page: window.location.pathname
                });
            }

            // Email clicks
            if (target.href && target.href.startsWith('mailto:')) {
                this.trackInteraction('email_click', {
                    element: target.tagName,
                    email: target.href.replace('mailto:', ''),
                    page: window.location.pathname
                });
            }
        });

        // Track page views
        this.trackPageView();
    }

    // Remove event listeners
    removeEventListeners() {
        // Clean up if needed
    }

    // Track page view
    trackPageView() {
        this.trackInteraction('page_view', {
            page: window.location.pathname,
            referrer: document.referrer
        });
    }

    // Track individual interaction
    trackInteraction(action, data = {}) {
        const interaction = {
            sessionId: this.sessionId,
            action: action,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            userAgent: navigator.userAgent,
            ...data
        };

        this.interactions.push(interaction);
        this.sendToBackend(interaction);
        
        console.log('Tracked interaction:', interaction);
    }

    // Send interaction to backend
    async sendToBackend(interaction) {
        try {
            const response = await fetch(API_ENDPOINTS.TRACK_INTERACTION, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(interaction)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Interaction tracked successfully:', result);
                
                // Update lead score if available
                if (result.leadScore !== undefined) {
                    this.updateLeadScoreDisplay(result.leadScore);
                }
            } else {
                console.error('Failed to track interaction:', response.status);
            }
        } catch (error) {
            console.error('Error tracking interaction:', error);
        }
    }

    // Update lead score display (if on CRM page)
    updateLeadScoreDisplay(score) {
        const scoreElement = document.querySelector('[data-lead-score]');
        if (scoreElement) {
            scoreElement.textContent = score;
            scoreElement.className = this.getScoreColorClass(score);
        }
    }

    // Get score color class
    getScoreColorClass(score) {
        if (score >= 80) return 'text-green-600 font-bold';
        if (score >= 60) return 'text-yellow-600 font-bold';
        if (score >= 40) return 'text-orange-600 font-bold';
        return 'text-red-600 font-bold';
    }

    // Get session summary
    getSessionSummary() {
        return {
            sessionId: this.sessionId,
            totalInteractions: this.interactions.length,
            actions: this.interactions.reduce((acc, interaction) => {
                acc[interaction.action] = (acc[interaction.action] || 0) + 1;
                return acc;
            }, {}),
            startTime: this.interactions[0]?.timestamp,
            endTime: this.interactions[this.interactions.length - 1]?.timestamp
        };
    }
}

// Create global instance
const clickTracker = new ClickTracker();

// Make it globally available
window.clickTracker = clickTracker;

// Auto-start tracking when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        clickTracker.start();
    });
} else {
    clickTracker.start();
}

export default clickTracker; 