# Fix for Google Maps Theme Not Changing

## Root Cause

The issue is that when using a `mapId` prop in the `@vis.gl/react-google-maps` Map component, Google Maps API prioritizes the styling configured in the Google Cloud Console for that Map ID over any runtime styles passed via the `options.styles` property.

## Solution

There are several approaches to fix this:

### Option 1: Use setOptions with useMap Hook (Recommended)

Add theme updating logic to the MapContent component:

```tsx
// In MapContent.tsx, add this after the useMap() call:

import { useThemeDetection } from '@/hooks/use-theme-detection'
import { MAP_STYLES } from '../utils/constants'

// Inside MapContent component:
const map = useMap()
const { isDarkMode } = useThemeDetection()

// Update map styles when theme changes
useEffect(() => {
  if (map) {
    map.setOptions({
      styles: isDarkMode ? MAP_STYLES.dark : MAP_STYLES.light
    })
  }
}, [map, isDarkMode])
```

### Option 2: Remove Map ID When Using Custom Styles

In AgencyMapOptimized.tsx, conditionally use mapId:

```tsx
<Map
  // Only use mapId if no custom styles are needed
  // mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
  
  defaultCenter={center}
  defaultZoom={14}
  reuseMaps={true}
  options={mapOptions}
>
```

### Option 3: Use Theme-Specific Map IDs

Create separate Map IDs in Google Cloud Console with appropriate styling:

```tsx
<Map
  mapId={isDarkMode 
    ? process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_DARK 
    : process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_LIGHT
  }
  defaultCenter={center}
  defaultZoom={14}
  reuseMaps={true}
  // Remove options.styles since styling is in the Map ID
>
```

### Option 4: Force Map Re-render on Theme Change

Add a key prop to force complete re-initialization:

```tsx
<Map
  key={`map-${isDarkMode ? 'dark' : 'light'}`}
  mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
  defaultCenter={center}
  defaultZoom={14}
  reuseMaps={false} // Important: disable reuse for this approach
  options={mapOptions}
>
```

## Recommended Implementation

Here's the complete fix using Option 1 (most performant):

### 1. Update MapContent.tsx

```tsx
'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useMap, InfoWindow, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps'
import { useThemeDetection } from '@/hooks/use-theme-detection'
import { MAP_STYLES } from '../utils/constants'
// ... other imports

export const MapContent: React.FC<MapContentProps> = ({ 
  agencies, 
  searchLocation, 
  selectedAgencies, 
  onAgencySelect, 
  onStartAnalysis, 
  isLoading 
}) => {
  // Get map instance from context
  const map = useMap()
  
  // Get theme information
  const { isDarkMode } = useThemeDetection()
  
  // Update map styles when theme changes
  useEffect(() => {
    if (map) {
      map.setOptions({
        styles: isDarkMode ? MAP_STYLES.dark : MAP_STYLES.light,
        // Preserve other options
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        keyboardShortcuts: false,
        clickableIcons: false,
      })
    }
  }, [map, isDarkMode])
  
  // ... rest of component
}
```

### 2. Update AgencyMapOptimized.tsx (Optional - Remove mapId)

```tsx
<Map
  // Comment out or remove mapId to allow runtime styling
  // mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
  
  defaultCenter={center}
  defaultZoom={14}
  reuseMaps={true}
  options={mapOptions}
>
```

## Testing

1. Toggle between light and dark themes
2. Verify the map styles update immediately
3. Check browser console for any errors
4. Test on both desktop and mobile devices

## Additional Considerations

1. **Performance**: Option 1 is most performant as it updates existing map instance
2. **Map ID Benefits**: If you need Map ID features (like Cloud-based styling, vector maps), use Option 3
3. **Smooth Transitions**: The existing CSS transition overlay should make theme changes smooth

## Debugging

Add these console logs to verify the fix:

```tsx
useEffect(() => {
  if (map) {
    const currentStyles = isDarkMode ? MAP_STYLES.dark : MAP_STYLES.light
    console.log('Applying map theme:', isDarkMode ? 'dark' : 'light')
    console.log('Styles:', currentStyles)
    
    map.setOptions({
      styles: currentStyles
    })
    
    // Verify styles were applied
    console.log('Map options after update:', map.getOptions())
  }
}, [map, isDarkMode])
```