
# Database Schema & Code Update Plan

## Current State Analysis

After investigating the codebase, I've identified the following areas that need attention:

### Database Schema Overview

The current Supabase schema includes:

**Core Social Tables (In Use)**
- `profiles` - User profiles with display names, avatars, bio, verification status
- `posts` - User posts with content, visibility, image attachments
- `follows` - Follow relationships between local users
- `favorites` - Like/favorite interactions
- `boosts` - Repost/boost interactions
- `notifications` - Activity notifications
- `conversations` - Direct message conversations
- `conversation_participants` - Users in conversations
- `messages` - Direct messages

**Federation Tables (No Longer Needed)**
- `federation_activities` - ActivityPub activity logs
- `federation_follows` - Cross-instance follow relationships
- `remote_actors` - Cached remote user profiles
- `actor_keys` - Cryptographic keys for federation signing
- `actor_keys_public` - Public view of actor keys
- `verification_requests` - User verification request tracking

---

## Issues Identified

### 1. Orphaned Federation Code
The previous Fediverse/ActivityPub functionality has been partially removed from the frontend, but significant backend infrastructure remains:

**Edge Functions Still Present:**
- `activitypub-actor/` - Serves ActivityPub actor profiles
- `activitypub-collections/` - Serves followers/following collections
- `activitypub-inbox/` - Receives ActivityPub activities
- `activitypub-outbox/` - Serves user activity outbox
- `follow-remote/` - Follows remote accounts
- `lookup-remote-actor/` - Resolves remote user handles
- `webfinger/` - WebFinger discovery protocol
- `fetch-trending/` - Fetches trending posts from Mastodon instances (still references "Fediverse")

**Database Tables:**
- `federation_activities`, `federation_follows`, `remote_actors`, `actor_keys` tables remain in schema

### 2. User Profile Page Issue
The `UserProfilePage.tsx` uses `fetchProfile(cleanUsername)` which queries by username. This is correct, but the page doesn't handle the case where:
- The profile might be a remote actor (from federation tables)
- The profile might not exist for the given username

The current implementation correctly fetches by username and displays "User not found" appropriately.

### 3. Unused Profile Fields
The `profiles` table has federation-related columns that are no longer needed:
- `actor_id` - ActivityPub actor URI
- `inbox_url` - ActivityPub inbox endpoint
- `public_key` - Federation signing key
- `instance` - Origin instance (defaults to 'koasocial.app')

---

## Recommended Updates

### Phase 1: Clean Up Frontend (Code Changes)

1. **Update `fetch-trending` edge function** to remove Fediverse references in comments
2. **Verify all components** work correctly with current schema:
   - Home page feed
   - User profiles
   - Post interactions (like, boost, reply)
   - Notifications
   - Messaging
   - Search

### Phase 2: Database Cleanup (Migration)

Remove unused federation infrastructure:

```text
Tables to remove:
- federation_activities
- federation_follows  
- remote_actors
- actor_keys
- actor_keys_public (view)

Profile columns to remove:
- actor_id
- inbox_url
- public_key

(Keep 'instance' column as it's used for display purposes)
```

### Phase 3: Edge Function Cleanup

Delete unused edge functions:
- `activitypub-actor/`
- `activitypub-collections/`
- `activitypub-inbox/`
- `activitypub-outbox/`
- `follow-remote/`
- `lookup-remote-actor/`
- `webfinger/`

Keep functional edge functions:
- `fetch-news/` - Powers the Trending News feature
- `fetch-trending/` - Could be repurposed or removed (currently fetches from Mastodon)

---

## Detailed Implementation Steps

### Step 1: Database Migration
Create a migration to drop unused tables and columns:

```sql
-- Drop federation-related tables
DROP TABLE IF EXISTS public.federation_follows CASCADE;
DROP TABLE IF EXISTS public.federation_activities CASCADE;
DROP TABLE IF EXISTS public.remote_actors CASCADE;
DROP VIEW IF EXISTS public.actor_keys_public;
DROP TABLE IF EXISTS public.actor_keys CASCADE;

-- Remove unused columns from profiles
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS actor_id,
  DROP COLUMN IF EXISTS inbox_url,
  DROP COLUMN IF EXISTS public_key;

-- Drop federation-related functions if any exist
DROP FUNCTION IF EXISTS public.sync_actor_to_profile() CASCADE;
```

### Step 2: Delete Edge Functions
Remove the following directories:
- `supabase/functions/activitypub-actor/`
- `supabase/functions/activitypub-collections/`
- `supabase/functions/activitypub-inbox/`
- `supabase/functions/activitypub-outbox/`
- `supabase/functions/follow-remote/`
- `supabase/functions/lookup-remote-actor/`
- `supabase/functions/webfinger/`

Also clean up the shared validation file that was primarily used for federation:
- Update or remove `supabase/functions/_shared/validation.ts`

### Step 3: Update/Remove fetch-trending
Either:
- **Option A**: Delete `fetch-trending` if Mastodon integration is unwanted
- **Option B**: Update it to fetch from different sources if a trending feature is still desired

### Step 4: Verify Core Functionality
Test that these features still work:
1. User registration and login
2. Creating and viewing posts
3. Liking and boosting posts
4. Following users
5. Viewing user profiles
6. Direct messaging
7. Notifications
8. Trending news

---

## Impact Assessment

### Breaking Changes
- Removes all federation/ActivityPub capability
- Existing `remote_actors` references in profiles will be lost
- Any federated follows will be removed

### No Impact On
- Local user accounts
- Local posts and interactions
- Direct messaging
- Notifications
- Authentication

---

## Technical Notes

### TypeScript Types
The `src/integrations/supabase/types.ts` file is auto-generated and will automatically update after the migration runs. No manual changes needed.

### RLS Policies
The migration will automatically drop policies on removed tables. Existing policies on remaining tables are unaffected.

### Database Functions
The `sync_actor_to_profile` trigger function should be dropped as it was used for federation.

### Secrets
The `INSTANCE_DOMAIN` secret can remain (harmless) or be removed if desired.

---

## Summary

| Action | Items | Risk |
|--------|-------|------|
| Delete edge functions | 7 functions | Low - unused |
| Drop database tables | 5 tables | Low - federation not in use |
| Remove profile columns | 3 columns | Low - not displayed in UI |
| Keep edge functions | 2 (fetch-news, fetch-trending) | None |
| Code verification | Messaging, profiles, posts | Testing required |
