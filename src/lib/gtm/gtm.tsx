/**
 * Google Tag Manager (GTM) integration module for Karmatic.
 * 
 * This module provides a comprehensive analytics tracking solution that:
 * - Tracks user interactions and conversions
 * - Monitors search behavior and limitations
 * - Measures registration funnel performance
 * - Provides insights for business decisions
 * 
 * All events follow Google Analytics 4 (GA4) event naming conventions
 * for better compatibility and reporting.
 */

/**
 * Google Tag Manager container ID from environment variables.
 * Set this in your .env.local file as NEXT_PUBLIC_GTM_ID
 */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

/**
 * Base interface for all GTM dataLayer events.
 * All events must have an event name and can include any additional properties.
 */
export interface GTMEvent {
  /** The event name that triggers GTM tags */
  event: string;
  /** Additional event parameters */
  [key: string]: any;
}

/**
 * Safely pushes events to the Google Tag Manager dataLayer.
 * 
 * This function:
 * - Checks for browser environment (SSR safe)
 * - Verifies dataLayer exists before pushing
 * - Provides a central point for all GTM communications
 * 
 * @param {GTMEvent} event - The event object to push to dataLayer
 * 
 * @example
 * ```typescript
 * pushToDataLayer({
 *   event: 'custom_event',
 *   category: 'user_action',
 *   label: 'button_click'
 * });
 * ```
 */
export const pushToDataLayer = (event: GTMEvent) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
  }
};

/**
 * Centralized event tracking object containing all analytics events.
 * 
 * Events are organized by category:
 * - Search events: Track search behavior and limitations
 * - Registration events: Monitor conversion funnel
 * - User interaction events: Measure engagement
 * - Page view events: Track navigation
 * 
 * All events include timestamp for accurate time-based analysis.
 */
export const trackEvent = {
  /**
   * Tracks when a user initiates a search.
   * 
   * This is a key conversion event that helps understand:
   * - Search volume and patterns
   * - Location popularity
   * - User authentication impact on behavior
   * 
   * @param {string} location - The location being searched
   * @param {string} [query] - Optional search filters or keywords
   * @param {boolean} [isAuthenticated=false] - Whether user is logged in
   */
  searchInitiated: (location: string, query?: string, isAuthenticated: boolean = false) => {
    pushToDataLayer({
      event: 'search_initiated',
      eventCategory: 'search',
      eventAction: 'search_initiated',
      eventLabel: location,
      searchLocation: location,
      searchQuery: query || '',
      userAuthenticated: isAuthenticated,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Tracks successful search completion.
   * Paired with searchInitiated to measure search success rate.
   */
  searchCompleted: (location: string, query?: string, isAuthenticated: boolean = false) => {
    pushToDataLayer({
      event: 'search_completed',
      eventCategory: 'search',
      eventAction: 'search_completed',
      eventLabel: location,
      searchLocation: location,
      searchQuery: query || '',
      userAuthenticated: isAuthenticated,
      timestamp: new Date().toISOString(),
    });
  },
  
  /**
   * Tracks when a search is blocked due to rate limiting.
   * Critical for understanding conversion friction points.
   */
  searchBlocked: (location: string, query?: string) => {
    pushToDataLayer({
      event: 'search_blocked',
      eventCategory: 'search',
      eventAction: 'search_blocked',
      eventLabel: location,
      searchLocation: location,
      searchQuery: query || '',
      reason: 'limit_reached',
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Tracks when users hit their search limit.
   * Used to optimize the limit threshold and conversion messaging.
   */
  searchLimitReached: (remainingSearches: number) => {
    pushToDataLayer({
      event: 'search_limit_reached',
      eventCategory: 'engagement',
      eventAction: 'limit_reached',
      eventLabel: 'search_limit',
      remainingSearches,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Registration funnel events for conversion optimization.
   */
  
  /**
   * Tracks when registration modal is displayed.
   * @param {string} trigger - What triggered the modal (e.g., 'search_limit', 'cta_click')
   */
  registrationModalShown: (trigger: string) => {
    pushToDataLayer({
      event: 'registration_modal_shown',
      eventCategory: 'registration',
      eventAction: 'modal_shown',
      eventLabel: trigger,
      registrationTrigger: trigger,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Tracks when users dismiss the registration modal.
   * Helps identify friction in the conversion funnel.
   */
  registrationModalDismissed: (trigger: string) => {
    pushToDataLayer({
      event: 'registration_modal_dismissed',
      eventCategory: 'registration',
      eventAction: 'modal_dismissed',
      eventLabel: trigger,
      registrationTrigger: trigger,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Tracks successful registration completion.
   * This is a primary conversion event.
   * 
   * @param {string} method - Registration method (e.g., 'google', 'email', 'github')
   * @param {string} trigger - What led to registration
   */
  registrationCompleted: (method: string, trigger: string) => {
    pushToDataLayer({
      event: 'registration_completed',
      eventCategory: 'registration',
      eventAction: 'registration_completed',
      eventLabel: method,
      registrationMethod: method,
      registrationTrigger: trigger,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * User engagement events for understanding user behavior.
   */
  
  /**
   * Tracks when a user selects an agency for detailed view.
   * Helps identify popular agencies and user preferences.
   */
  agencySelected: (agencyName: string, agencyId: string) => {
    pushToDataLayer({
      event: 'agency_selected',
      eventCategory: 'engagement',
      eventAction: 'agency_selected',
      eventLabel: agencyName,
      agencyId,
      agencyName,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Tracks when users request AI analysis of agencies.
   * Indicates high-intent users likely to convert.
   */
  agencyAnalysisRequested: (agencyCount: number) => {
    pushToDataLayer({
      event: 'agency_analysis_requested',
      eventCategory: 'engagement',
      eventAction: 'analysis_requested',
      eventValue: agencyCount,
      agencyCount,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Enhanced page view tracking with authentication status.
   * Supplements default GA4 page views with custom parameters.
   */
  pageView: (pagePath: string, pageTitle: string, userAuthenticated: boolean = false) => {
    pushToDataLayer({
      event: 'page_view',
      pagePath,
      pageTitle,
      userAuthenticated,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Initializes Google Tag Manager on the client side.
 * 
 * This function should be called once during app initialization,
 * typically in the root layout or _app.tsx file. It:
 * - Validates GTM ID exists
 * - Creates the dataLayer array
 * - Pushes the initial GTM event
 * 
 * @example
 * ```typescript
 * // In app/layout.tsx
 * useEffect(() => {
 *   initGTM();
 * }, []);
 * ```
 */
export const initGTM = () => {
  if (!GTM_ID) {
    console.warn('GTM ID not found. Skipping Google Tag Manager initialization.');
    return;
  }

  // Push initial dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });
};

/**
 * React component that renders the GTM script tag.
 * 
 * This component should be placed in the <head> section of your
 * document, typically in the root layout. It loads GTM asynchronously
 * to avoid blocking page render.
 * 
 * @returns {JSX.Element | null} The GTM script tag or null if no GTM ID
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx
 * <head>
 *   <GTMScript />
 * </head>
 * ```
 */
export const GTMScript = () => {
  if (!GTM_ID) return null;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
      }}
    />
  );
};

/**
 * React component that renders the GTM noscript fallback.
 * 
 * This component should be placed immediately after the opening <body>
 * tag. It ensures GTM works even when JavaScript is disabled,
 * though with limited functionality.
 * 
 * @returns {JSX.Element | null} The GTM noscript iframe or null if no GTM ID
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx
 * <body>
 *   <GTMNoScript />
 *   {children}
 * </body>
 * ```
 */
export const GTMNoScript = () => {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
};

// Type declarations for window object
declare global {
  interface Window {
    dataLayer: any[];
  }
}