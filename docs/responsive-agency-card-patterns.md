# Agency Card Location Map - Responsive Design Patterns

## Overview

The enhanced `AgencyCardLocationMapEnhanced` component provides a premium multi-device experience with adaptive layouts and interactions optimized for mobile, tablet, and desktop viewports.

## Responsive Breakpoints

Using Tailwind CSS's default breakpoints with custom viewport detection:

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px  
- **Desktop**: ≥ 1024px

## Key Responsive Features

### 1. **Adaptive Layout Positioning**

#### Mobile (Full-screen modal)
```css
- Position: fixed inset-x-0 bottom-0 h-full
- Animation: Slides up from bottom
- Interaction: Swipe gestures enabled
```

#### Tablet (Centered modal)
```css
- Position: fixed inset-x-4 bottom-4 h-[85vh] max-w-2xl mx-auto
- Animation: Scale and fade in
- Interaction: Swipe gestures enabled
- Feature: Fullscreen toggle available
```

#### Desktop (Side panel)
```css
- Position: fixed right-4 top-4 bottom-4 w-[480px-600px]
- Animation: Slide in from right
- Interaction: Click-based navigation
- Feature: Fullscreen toggle, no swipe
```

### 2. **Progressive Enhancement**

#### Navigation Controls
- **Mobile/Tablet**: Dot indicators with swipe
- **Desktop**: Previous/Next buttons with dot indicators

#### Content Density
- **Mobile**: Compact single-column layout
- **Tablet**: Enhanced spacing, larger touch targets
- **Desktop**: Two-column grids for reviews and hours

#### Typography Scaling
```css
- Mobile: text-sm (14px) base
- Tablet: text-base (16px) base  
- Desktop: text-base to text-lg (16-18px)
```

### 3. **Interaction Patterns**

#### Swipe Gestures
- Mobile threshold: 50px
- Tablet threshold: 100px
- Desktop: Disabled (button navigation)

#### Visual Feedback
- Hover states on desktop
- Active states on touch devices
- Loading states during transitions

### 4. **Performance Optimizations**

#### Conditional Rendering
- Pull indicator only on mobile
- Backdrop only on mobile/tablet
- Swipe hint only on touch devices

#### Animation Performance
```javascript
transition: { type: 'spring', damping: 30, stiffness: 300 }
```

### 5. **Accessibility Features**

- Keyboard navigation (Arrow keys + Escape)
- Focus management
- ARIA labels for interactive elements
- Sufficient touch target sizes (min 44x44px)

## Component Architecture

### Viewport Detection
```typescript
useEffect(() => {
  const checkViewportSize = () => {
    const width = window.innerWidth
    if (width < 768) setViewportSize('mobile')
    else if (width < 1024) setViewportSize('tablet')
    else setViewportSize('desktop')
  }
  // ...
}, [])
```

### Responsive Classes Helper
```typescript
const getContainerClasses = () => {
  if (viewportSize === 'mobile') return cn(base, "inset-x-0 bottom-0 h-full")
  if (viewportSize === 'tablet') return cn(base, isFullscreen ? "inset-0" : "...")
  return cn(base, "desktop classes...")
}
```

## Premium UI Elements

### 1. **Glassmorphism Effects**
- Backdrop blur on headers
- Semi-transparent overlays
- Smooth transitions

### 2. **Modern Card Design**
- Rounded corners adaptive to viewport
- Shadow depth increases on larger screens
- Border treatments on desktop

### 3. **Interactive States**
- Hover effects on desktop
- Press feedback on mobile
- Smooth color transitions

### 4. **Content Prioritization**
- Essential info always visible
- Progressive disclosure for details
- Expandable sections for reviews

## Usage Guidelines

### Mobile-First Development
1. Start with mobile layout
2. Enhance for tablet
3. Optimize for desktop

### Testing Recommendations
- Test swipe gestures on real devices
- Verify keyboard navigation
- Check animation performance
- Validate touch target sizes

### Performance Considerations
- Use `will-change` for animated properties
- Implement virtual scrolling for long lists
- Lazy load images and non-critical content
- Minimize re-renders with proper memoization

## Future Enhancements

1. **Container Queries** (Tailwind CSS 4)
   - Component-level responsive design
   - Parent-based breakpoints

2. **Advanced Gestures**
   - Pinch to zoom on images
   - Long press for quick actions
   - Velocity-based animations

3. **Adaptive Loading**
   - Reduced motion for low-end devices
   - Progressive image loading
   - Conditional feature loading

## Tailwind CSS 4 Integration

The component is ready for Tailwind CSS 4 features:

- Container queries with `@container`
- Arbitrary media queries
- CSS-first configuration
- Enhanced breakpoint system

This creates a truly premium, responsive experience across all devices while maintaining code maintainability and performance.