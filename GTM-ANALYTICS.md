# GTM & Analytics Documentation

## Table of Contents
- [Overview](#overview)
- [Setup Guide](#setup-guide)
- [Event Tracking Architecture](#event-tracking-architecture)
- [Tracked Events](#tracked-events)
- [Implementation Guide](#implementation-guide)
- [GTM Configuration](#gtm-configuration)
- [Analytics Reports](#analytics-reports)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Karmatic uses Google Tag Manager (GTM) for comprehensive analytics tracking. This documentation covers the implementation, configuration, and analysis of user behavior data.

### Why GTM?

1. **Flexibility** - Update tracking without code deployments
2. **Performance** - Asynchronous loading doesn't block rendering
3. **Integration** - Easy connection to GA4, Facebook Pixel, etc.
4. **Version Control** - GTM provides versioning for configurations
5. **Debug Tools** - Preview mode for testing before publishing

## Setup Guide

### 1. Create GTM Container

1. Go to [Google Tag Manager](https://tagmanager.google.com)
2. Create a new container for your website
3. Copy the container ID (format: GTM-XXXXXX)

### 2. Environment Configuration

Add your GTM ID to the environment variables:

```env
# .env.local
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX
```

### 3. Install GTM in Next.js

The GTM integration is already set up in the layout file:

```tsx
// app/layout.tsx
import { GTMScript, GTMNoScript } from '@/lib/gtm/gtm';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GTMScript />
      </head>
      <body>
        <GTMNoScript />
        {children}
      </body>
    </html>
  );
}
```

### 4. Initialize GTM

GTM is initialized on the client side:

```tsx
// In a client component or custom hook
useEffect(() => {
  initGTM();
}, []);
```

## Event Tracking Architecture

### Event Naming Convention

All events follow a consistent naming pattern:

```
{category}_{action}
```

Examples:
- `search_initiated`
- `registration_completed`
- `agency_selected`

### Event Parameters

Standard parameters included in all events:
- `timestamp` - ISO 8601 formatted timestamp
- `eventCategory` - Event category for grouping
- `eventAction` - Specific action taken
- `eventLabel` - Additional context (optional)

### Event Flow

```
User Action → trackEvent Function → dataLayer.push → GTM → Analytics Tools
```

## Tracked Events

### Search Events

#### search_initiated
Fired when a user starts a search.

**Parameters:**
- `searchLocation` (string) - Location being searched
- `searchQuery` (string) - Additional search filters
- `userAuthenticated` (boolean) - User login status

**Example:**
```typescript
trackEvent.searchInitiated('Mexico City', 'Toyota dealers', false);
```

#### search_completed
Fired when search results are successfully loaded.

**Parameters:**
- Same as search_initiated

#### search_blocked
Fired when an anonymous user hits the search limit.

**Parameters:**
- `searchLocation` (string) - Attempted search location
- `searchQuery` (string) - Attempted search query
- `reason` (string) - Always "limit_reached"

#### search_limit_reached
Fired when the search limit indicator shows 0 remaining.

**Parameters:**
- `remainingSearches` (number) - Should be 0

### Registration Events

#### registration_modal_shown
Fired when the sign-up modal is displayed.

**Parameters:**
- `registrationTrigger` (string) - What caused the modal
  - `search_limit` - Hit search limit
  - `cta_click` - Clicked sign-up button
  - `navigation` - Used header link

#### registration_modal_dismissed
Fired when user closes the modal without signing up.

**Parameters:**
- `registrationTrigger` (string) - Same as above

#### registration_completed
Fired after successful registration.

**Parameters:**
- `registrationMethod` (string) - How they registered
  - `google` - Google OAuth
  - `github` - GitHub OAuth
  - `email` - Email/password
- `registrationTrigger` (string) - What led to registration

### Engagement Events

#### agency_selected
Fired when user clicks on an agency for details.

**Parameters:**
- `agencyId` (string) - Unique agency identifier
- `agencyName` (string) - Agency display name

#### agency_analysis_requested
Fired when user requests AI analysis.

**Parameters:**
- `agencyCount` (number) - Number of agencies selected (1-3)

### Page View Events

#### page_view
Enhanced page view with authentication status.

**Parameters:**
- `pagePath` (string) - Current URL path
- `pageTitle` (string) - Page title
- `userAuthenticated` (boolean) - Login status

## Implementation Guide

### Basic Event Tracking

```typescript
import { trackEvent } from '@/lib/gtm/gtm';

// In your component
const handleSearch = () => {
  // Track the search initiation
  trackEvent.searchInitiated(location, query, isAuthenticated);
  
  // Perform the search
  performSearch();
};
```

### Conditional Tracking

```typescript
// Track based on user state
if (!canSearch) {
  trackEvent.searchBlocked(location, query);
  trackEvent.registrationModalShown('search_limit');
} else {
  trackEvent.searchInitiated(location, query, true);
}
```

### Error Tracking

```typescript
try {
  const results = await searchAgencies(location);
  trackEvent.searchCompleted(location, query, isAuthenticated);
} catch (error) {
  // Track search failures (custom event)
  pushToDataLayer({
    event: 'search_failed',
    errorMessage: error.message,
    searchLocation: location
  });
}
```

## GTM Configuration

### Required Tags

1. **Google Analytics 4 Configuration**
   ```
   Tag Type: Google Analytics: GA4 Configuration
   Measurement ID: G-XXXXXXXXXX
   Trigger: All Pages
   ```

2. **Search Events**
   ```
   Tag Type: Google Analytics: GA4 Event
   Event Name: {{Event}}
   Trigger: Custom Event - search_*
   ```

3. **Registration Conversion**
   ```
   Tag Type: Google Analytics: GA4 Event
   Event Name: sign_up
   Trigger: Custom Event - registration_completed
   Mark as conversion: Yes
   ```

### Required Variables

1. **Event Variable**
   ```
   Variable Type: Data Layer Variable
   Variable Name: event
   ```

2. **Search Location**
   ```
   Variable Type: Data Layer Variable
   Variable Name: searchLocation
   ```

3. **User Authenticated**
   ```
   Variable Type: Data Layer Variable
   Variable Name: userAuthenticated
   ```

### Required Triggers

1. **All Search Events**
   ```
   Trigger Type: Custom Event
   Event Name: search_.*
   Use regex matching: Yes
   ```

2. **Registration Events**
   ```
   Trigger Type: Custom Event
   Event Name: registration_.*
   Use regex matching: Yes
   ```

## Analytics Reports

### Key Metrics to Track

1. **Search Metrics**
   - Total searches per day
   - Search-to-registration conversion rate
   - Most searched locations
   - Search limit hit rate

2. **User Metrics**
   - Anonymous vs authenticated ratio
   - Registration conversion funnel
   - User retention (return visits)
   - Feature adoption rates

3. **Engagement Metrics**
   - Agencies viewed per session
   - Analysis requests per user
   - Time to first search
   - Session duration by user type

### Custom Reports in GA4

1. **Search Limit Impact Report**
   - Dimension: User Type (anonymous/authenticated)
   - Metrics: Searches, Blocks, Registrations
   - Filter: Event name contains "search"

2. **Registration Funnel**
   - Steps: Modal Shown → Modal Engaged → Completed
   - Breakdown by trigger source

3. **Location Popularity**
   - Dimension: Search Location
   - Metrics: Total Searches, Unique Users
   - Secondary dimension: User Type

## Best Practices

### 1. Event Naming
- Use lowercase with underscores
- Be descriptive but concise
- Follow category_action pattern
- Avoid special characters

### 2. Parameter Values
- Keep values consistent (e.g., always lowercase)
- Use meaningful labels
- Avoid PII (personally identifiable information)
- Validate data before sending

### 3. Performance
- Batch related events when possible
- Avoid tracking every micro-interaction
- Use sampling for high-volume events
- Monitor dataLayer size

### 4. Privacy
- Respect user consent
- Don't track sensitive information
- Implement opt-out mechanisms
- Follow GDPR/CCPA guidelines

## Troubleshooting

### GTM Preview Mode

1. In GTM, click "Preview"
2. Enter your website URL
3. Debug tags in real-time
4. Check dataLayer values

### Common Issues

#### Events Not Firing
```javascript
// Check if GTM is loaded
console.log(window.dataLayer);

// Manually test event
window.dataLayer.push({
  event: 'test_event',
  test: true
});
```

#### Wrong Event Parameters
```javascript
// Debug event before sending
console.log('Tracking event:', {
  event: 'search_initiated',
  searchLocation: location,
  // ... other parameters
});
```

#### GTM Not Loading
1. Check environment variable is set
2. Verify script tags in HTML
3. Check browser console for errors
4. Disable ad blockers for testing

### Debug Helper

```typescript
// Add to development builds only
if (process.env.NODE_ENV === 'development') {
  window.dataLayer = window.dataLayer || [];
  const originalPush = window.dataLayer.push;
  window.dataLayer.push = function(...args) {
    console.log('GTM Event:', ...args);
    return originalPush.apply(window.dataLayer, args);
  };
}
```

## Advanced Topics

### Enhanced E-commerce Tracking
Future implementation for premium features:

```typescript
trackEvent.purchaseCompleted({
  transaction_id: '12345',
  value: 29.99,
  currency: 'USD',
  items: [{
    item_name: 'Premium Monthly',
    item_id: 'premium_monthly',
    price: 29.99,
    quantity: 1
  }]
});
```

### Server-Side Tracking
For sensitive events or better reliability:

```typescript
// API route
await fetch('https://www.google-analytics.com/mp/collect', {
  method: 'POST',
  body: JSON.stringify({
    client_id: clientId,
    events: [{
      name: 'subscription_created',
      params: { value: 29.99 }
    }]
  })
});
```

### Custom Dimensions
Set up in GA4 for advanced segmentation:

1. User Type (anonymous/free/premium)
2. Search Count (lifetime searches)
3. Registration Source
4. Preferred Location

---

## Conclusion

Proper analytics implementation is crucial for understanding user behavior and optimizing the Karmatic platform. This tracking architecture provides comprehensive insights while maintaining performance and privacy standards.

For questions or additional tracking needs, consult the GTM and GA4 documentation or reach out to the development team.