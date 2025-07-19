# Changelog

All notable changes to the Karmatic project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Query Intent Analysis Tool** - Intelligent automotive advisor using Kimi K2
  - Replaces simple regex parser with AI-powered analysis
  - Multi-country support (MX, CO, AR, CL) with localized insights
  - Vehicle identification, pricing, and market availability
  - Competitor analysis and intelligent alternatives
  - Search strategy recommendations per query type
- **Country Detection** - Automatic extraction from geocoding results
  - ISO country codes passed through the analysis pipeline
  - LocationAutocomplete enhanced to extract country information
  - Frontend updated to pass country data to backend
- **Non-Automotive Query Validation**
  - Frontend validation to prevent non-automotive searches
  - Backend fallback for unrelated queries
  - Improved user experience with clear error messages

### Changed
- **Location Type** - Added optional `country` field
- **SearchData Type** - Updated to include country in coordinates
- **API Analyze Route** - Integrated new query intent analysis
- **Search Form Validation** - Added automotive-specific validation

### Removed
- **Legacy Query Parser** - Removed `query-parser.ts` and all references
  - Regex-based parsing replaced with AI analysis
  - Simplified pipeline with better accuracy

### Fixed
- Query analysis now provides actual value instead of just extracting entities
- Country-specific information now properly influences search results
- **Google Places API Migration** - Migrated from old Nearby Search API to new Places API v1
  - Phone numbers and websites now retrieved in initial search request
  - Eliminated need for separate Place Details API calls
  - Re-enabled phone and website filters for better agency quality
  - Improved performance with single API call instead of multiple

## [0.2.0] - 2025-01-15

### Added
- Full authentication system with Clerk
- Routed application architecture
- Search history with instant updates
- Soft delete system for data recovery
- AI-powered agency analysis (Phase 1)

## [0.1.0] - 2024-12-15

### Added
- Initial release with core search functionality
- Google Maps integration
- Basic agency profiles
- Search limiting for anonymous users