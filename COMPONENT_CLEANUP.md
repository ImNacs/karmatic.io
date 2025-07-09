# Component Cleanup Plan

## ⚠️ Components Currently In Use (DO NOT REMOVE)
- `agency-comparison.tsx` - Used for comparing agencies
- `agency-card-location-map-enhanced.tsx` - Used in agency-map-optimized

## Components to Remove (Safe)

### Map Components (3 unused variants)
```bash
rm src/components/agency-map.tsx                # 174 lines
rm src/components/agency-map-enhanced.tsx       # 678 lines  
rm src/components/agency-map-desktop.tsx        # 1,058 lines
```

### Card Components (only base version)
```bash
rm src/components/agency-card-location-map.tsx  # 450 lines
# KEEP agency-card-location-map-enhanced.tsx - it's being used!
```

### Header Components (replaced by sidebar)
```bash
rm src/components/auth-header.tsx               # 149 lines
rm src/components/header.tsx                    # 149 lines
```

### Desktop-Specific (using responsive instead)
```bash
rm src/components/agency-detail-desktop.tsx     # 995 lines
```

### Unused UI Components
```bash
rm src/components/ui/select.tsx
rm src/components/ui/textarea.tsx
# Note: stat-card.tsx doesn't exist in the filesystem
```

## Verification Steps

1. Search for imports:
```bash
grep -r "agency-map'" src/ --exclude-dir=node_modules
grep -r "agency-card-location" src/ --exclude-dir=node_modules
grep -r "auth-header\|header'" src/ --exclude-dir=node_modules
```

2. Run build:
```bash
pnpm build
```

3. Check bundle size:
```bash
pnpm analyze
```

## Expected Results
- Bundle size reduction: ~150-200KB
- Build time improvement: 15-20%
- Cleaner component structure
- No functionality loss