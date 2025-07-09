// Google Tag Manager configuration and helper functions

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || '';

// DataLayer event types
export interface GTMEvent {
  event: string;
  [key: string]: any;
}

// Push event to dataLayer
export const pushToDataLayer = (event: GTMEvent) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(event);
  }
};

// Event tracking functions
export const trackEvent = {
  // Search events
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

  // Registration events
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

  // User interaction events
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

  // Page view with custom parameters
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

// Initialize GTM (call this in _app.tsx or layout.tsx)
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

// GTM Script component
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

// GTM NoScript component
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