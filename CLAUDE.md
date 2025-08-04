# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev        # Start development server on localhost:3000
npm run build      # Build production version
npm run start      # Start production server
npm run lint       # Run ESLint (currently disabled in builds)
```

## Architecture Overview

This is a Korean AI-powered SNS content generation platform built with Next.js 15 App Router, featuring automated content scheduling and subscription management.

### Core Technology Stack
- **Frontend**: Next.js 15 with App Router, React 19, Chakra UI, TypeScript
- **Backend**: Next.js API routes with Supabase for database/auth
- **AI Integration**: Anthropic Claude API via @anthropic-ai/sdk
- **Scheduling**: QStash from Upstash for content generation automation
- **Payments**: TossPayments SDK for Korean market
- **PWA**: next-pwa for mobile app experience

### Key Architectural Patterns

**Authentication Flow**:
- Custom AuthProvider wraps the app with session management
- ProtectedRoute component guards authenticated pages
- Supabase handles authentication with custom Korean UI
- Server and client-side Supabase clients are separated for SSR safety

**Content Generation Workflow**:
1. User creates prompt templates in `/schedule` page (stored in localStorage)
2. Templates generate schedules in Supabase database 
3. QStash triggers `/api/content/generate-scheduled` at scheduled times
4. Generated content appears in `/content/library` with `schedule_id` linking

**State Management**:
- Custom hooks pattern: `useAuth`, `useUser`, `useContents`, `useSchedules`
- Each hook manages specific domain logic and API interactions
- LocalStorage used for prompt templates (client-side persistence)

### Critical Configuration

**Environment Variables Required**:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` for Claude API
- `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY` for scheduling
- `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` for payments

**Build Configuration**:
- ESLint and TypeScript errors are ignored during builds (`next.config.js`)
- This enables faster deployment but requires manual code quality checks

### Data Relationships

**Core Entities**:
- `users` → subscription info and usage limits
- `contents` → AI-generated content with optional `schedule_id` 
- `schedules` → automation rules linking to content generation
- Prompt templates stored in browser localStorage (not database)

**Content Types**: `x_post`, `thread`, `blog_post`, `youtube_script`, `instagram_reel_script`, `linkedin_post`, `facebook_post`

**User Tiers**: `free`, `pro`, `premium` with different limits in `PLAN_LIMITS` constant

### Korean Localization

All UI text, error messages, and user-facing content is in Korean. The app targets Korean users with:
- Korean payment integration (TossPayments)
- Korean-style date/number formatting
- Cultural UI patterns (emojis, honorifics in messages)

### API Route Structure

**Content Generation**:
- `/api/content/generate` - Manual content generation
- `/api/content/generate-scheduled` - Automated generation triggered by QStash

**Schedule Management**:
- `/api/schedule/create` - Create new schedule
- `/api/schedule/run` - Manual schedule execution  
- `/api/schedule/test` - QStash testing endpoint

### Common Debugging Areas

**Hydration Issues**: 
- ColorModeScript removed from ChakraProvider to prevent SSR mismatches
- Window checks in Supabase client creation for SSR compatibility

**Authentication**:
- Separate server/client Supabase instances prevent auth context issues
- AuthProvider handles both server and client-side session management

**Scheduling**:
- QStash webhook signature verification can be disabled for development
- Schedule execution requires active subscription status checks