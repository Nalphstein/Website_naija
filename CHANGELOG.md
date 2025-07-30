# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### In Progress
- **Component Architecture Refactoring**
  - Restructured BracketPage component into smaller, focused components
  - Extracted `WeekNavigation`, `FixtureList`, `FixtureMatchCard`, `WeekStatistics`, `TournamentOverview`, and `PlayoffBracket` components from `BracketPage.tsx` for improved modularity and maintainability.
  - Refactored main tournament logic to delegate UI and state management to these new components.
  - Enhanced debugging by adding `console.log` statements for fixture score persistence and tournament state restoration.
  - Planning to further improve tournament state persistence using a hybrid approach with `localStorage` (for quick access/caching) and Firestore (as the source of truth).
  - Fixed circular dependencies in component imports
  - Standardized export/import patterns across components
  - Resolved TypeScript module resolution issues
  - Improved barrel file organization
- **Cloudinary Integration for Team Logos**
  - Implemented client-side image upload to Cloudinary for team logos
  - Added `uploadTeamLogo` function in `teamservice.ts` to handle direct uploads
  - Ensured Firebase remains the primary data store for all non-image data
- **State Persistence and Debugging**
  - Implementing robust restoration of tournament object and ID after navigation using `localStorage` and Firestore.
  - Ensuring fixture scores and tournament state are reliably loaded and saved across navigation and refreshes.
  - Continuing to extract and modularize any remaining logic from `BracketPage.tsx`.

### Current Issues
- **TypeScript and Module Resolution**
  - Parent configuration missing in tsconfig.json
  - Module resolution errors for component imports
  - Inconsistent export patterns between components
  - Need to align type definitions with component props

### Recent Fixes
- **Component Structure**
  - Resolved circular references in PlayoffBracket exports
  - Fixed import paths in BracketPage component
  - Updated type definitions for Fixture and Match interfaces
  - Standardized component exports using index files
- **Fixture Score Persistence**
  - Refactored `fixtureService.ts` to use a composite key (`tournamentId_fixtureKey`) for saving and retrieving fixture scores in Firestore.
  - Improved error handling and logging for score loading and saving.
  - Added real-time subscription and batch save functions for fixture scores.
  - Ensured previously recorded scores are loaded and displayed after navigation.
- **Favicon Customization**
  - Updated `layout.tsx` to reference a custom favicon (`/League_Logo.png`) instead of the default Vercel/Next.js icon.
  - Verified favicon changes by clearing browser cache and restarting the dev server.

### Changed
- **Component Organization**
  - Restructured component directories for better modularity
  - Updated export patterns to avoid circular dependencies
  - Improved TypeScript type safety across components
  - Enhanced component documentation and prop types

### Added
- **Live Scoring & Standings Page**
  - Introduced `LiveScoringPage.tsx` to display real-time team standings and statistics.
  - Features dynamic leaderboard with ranking icons (🥇🥈🥉), color-coded highlights for top teams, and sortable stats (points, wins, losses).
  - Includes summary cards for current leader, most wins, and total points.
  - Enhanced UI with responsive design and improved visual clarity for rankings and stats.
- **Type Definitions**
  - Added missing properties to Fixture interface
  - Enhanced Match interface with additional properties
  - Improved type safety for component props
  - Added proper null checks and default values

### Pending Tasks
- **Immediate Next Steps**
  - Resolve remaining TypeScript errors
  - Fix module resolution configuration
  - Complete component export/import standardization
  - Update documentation for new component structure
  - Document Cloudinary setup and usage in project README
  - Add image validation and error handling improvements for uploads
  - Review security of client-side upload presets and consider server-side signature if needed
- **Favicon Format Improvements**
  - Consider providing multiple favicon formats for broader browser compatibility (e.g., SVG, ICO, PNG).
  - Add fallback icons for legacy browsers.


