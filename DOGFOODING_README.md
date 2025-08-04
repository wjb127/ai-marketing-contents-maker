# AI SNS Contents Maker - Dogfooding Setup

## 🐕 Dogfooding Mode Enabled

This project is currently configured for dogfooding (self-testing) with authentication disabled for easier testing.

### Current Setup:
- **Authentication**: Disabled - All users automatically logged in as "Dogfooding User"
- **User ID**: `00000000-0000-0000-0000-000000000001`
- **Subscription**: Premium (unlimited access)
- **Email**: `dogfooding@test.com`

### Database Setup:

1. **Use the simplified schema** (`database/schema-dogfooding.sql`):
   ```sql
   -- Run this in your Supabase SQL editor
   -- This creates all tables without auth dependencies
   ```

2. **Environment Variables** (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   ANTHROPIC_API_KEY=your_anthropic_api_key
   
   # TossPayments Test Keys
   NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY=test_ck_test_key_here
   TOSS_PAYMENTS_SECRET_KEY=test_sk_test_key_here
   ```

### Modified Components for Dogfooding:

1. **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)
   - Bypasses all authentication checks

2. **useAuth Hook** (`src/hooks/useAuth.ts`)
   - Returns hardcoded user data

3. **useUser Hook** (`src/hooks/useUser.ts`)
   - Returns hardcoded user profile

4. **Navbar** (`src/components/layout/Navbar.tsx`)
   - Always shows logged-in state
   - Login/Signup buttons removed

5. **API Routes**:
   - `/api/content/generate` - Auth checks disabled
   - `/api/payment/confirm` - Auth checks disabled

### Testing Features:

1. **Content Generation**
   - Go to `/content/create`
   - All content types available
   - No usage limits

2. **Scheduling**
   - Go to `/schedule`
   - Create unlimited schedules

3. **Content Library**
   - Go to `/content/library`
   - View all generated content

4. **Subscription**
   - Go to `/subscription`
   - Shows Premium plan active

### Reverting to Production Mode:

When ready to enable authentication:

1. Use the original schema (`database/schema.sql`)
2. Revert the following files from git:
   - `src/components/auth/ProtectedRoute.tsx`
   - `src/hooks/useAuth.ts`
   - `src/hooks/useUser.ts`
   - `src/components/layout/Navbar.tsx`
   - `src/app/api/content/generate/route.ts`
   - `src/app/api/payment/confirm/route.ts`

### Quick Start:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Notes:
- Payment functionality still works but won't update user subscription (already Premium)
- All data is saved to the database with the dogfooding user ID
- Perfect for testing all features without authentication friction