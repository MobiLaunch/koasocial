

# Database + Codebase Alignment & Twitter-like Polish Plan

## Summary of Issues Found

### Issue 1: Database Trigger Functions Reference Wrong Column
The notification trigger functions in the database reference `user_id` on tables that don't have that column:

**Broken Triggers:**
- `notify_on_favorite()` - References `posts.user_id` (should be `posts.author_id`)
- `notify_on_boost()` - References `posts.user_id` (should be `posts.author_id`)
- `notify_on_message()` - References `conversation_participants.user_id` (should be `conversation_participants.profile_id`)

This is why notifications are not being created when users interact with posts.

### Issue 2: Profile URL Inconsistency
Based on user preference for `/u/username` format:
- Current links use `/@username` format in multiple components
- `NotificationItem.tsx` uses `/profile/${username}` which doesn't match any route
- Need to standardize all profile links to `/u/username`

### Issue 3: Outdated Copyright Year
Two locations show "© 2024":
- `src/pages/LandingPage.tsx` line 147
- `src/components/RightSidebar.tsx` line 63

### Issue 4: Notifications Realtime Not Enabled
The `notifications` table is not in the Supabase realtime publication, so the real-time subscription in `useNotifications.tsx` won't work.

### Issue 5: DM Notifications Not Supported
User requested DM notifications. Currently the `messages` notification type exists in the CHECK constraint and NotificationItem config, but there's no trigger to create them.

---

## Implementation Plan

### Phase 1: Database Migration (Fixes Notification Creation)

Create a migration to fix the trigger functions:

```sql
-- Fix notify_on_favorite: posts.user_id -> posts.author_id
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_recipient_id UUID;
BEGIN
  SELECT author_id INTO v_recipient_id FROM posts WHERE id = NEW.post_id;
  IF v_recipient_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
    VALUES (v_recipient_id, NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix notify_on_boost: posts.user_id -> posts.author_id
CREATE OR REPLACE FUNCTION public.notify_on_boost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_recipient_id UUID;
BEGIN
  SELECT author_id INTO v_recipient_id FROM posts WHERE id = NEW.post_id;
  IF v_recipient_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
    VALUES (v_recipient_id, NEW.user_id, 'boost', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix notify_on_message: user_id -> profile_id
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_recipient_id UUID;
BEGIN
  SELECT profile_id INTO v_recipient_id FROM conversation_participants 
  WHERE conversation_id = NEW.conversation_id AND profile_id != NEW.sender_id LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
    VALUES (v_recipient_id, NEW.sender_id, 'message', NEW.conversation_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Create the message trigger (was missing)
DROP TRIGGER IF EXISTS tr_notify_on_message ON public.messages;
CREATE TRIGGER tr_notify_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Phase 2: Update Routes & Links (URL Standardization)

**Update Route in App.tsx:**
Change from `/:username` to `/u/:username`

**Files to Update Links:**
| File | Current Pattern | New Pattern |
|------|----------------|-------------|
| `src/App.tsx` | `/:username` | `/u/:username` |
| `src/components/PostCard.tsx` | `/@${author.username}` | `/u/${author.username}` |
| `src/pages/SearchPage.tsx` | `/@${user.username}` | `/u/${user.username}` |
| `src/pages/NotificationsPage.tsx` | `/@${notification.actor.username}` | `/u/${notification.actor.username}` |
| `src/components/NotificationItem.tsx` | `/profile/${username}` | `/u/${username}` |
| `src/pages/UserProfilePage.tsx` | Remove the `@` stripping logic (no longer needed) |

### Phase 3: Copyright Year Update

Update "2024" to "2026" in:
- `src/pages/LandingPage.tsx` line 147
- `src/components/RightSidebar.tsx` line 63

### Phase 4: Twitter-like UI Polish

**Styling Enhancements:**
1. **Notifications Page** - Already has good Twitter-like styling with dark theme, dividers, and icons
2. **Profile Page** - Add subtle hover states and improve spacing
3. **PostCard** - Already well-styled with animations
4. **Global** - Ensure consistent border colors and background opacity across components

**Specific Tweaks:**
- Add Twitter-like sticky header blur effect across pages (already present on NotificationsPage)
- Ensure consistent use of `divide-y divide-border` for list separation
- Add `hover:bg-accent/30` transitions on clickable list items

---

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Fix 3 trigger functions, add message trigger, enable realtime |
| `src/App.tsx` | Update route from `/:username` to `/u/:username` |
| `src/pages/UserProfilePage.tsx` | Remove `@` stripping, update logic |
| `src/components/PostCard.tsx` | Update 3 links from `/@` to `/u/` |
| `src/pages/SearchPage.tsx` | Update link from `/@` to `/u/` |
| `src/pages/NotificationsPage.tsx` | Update 2 links from `/@` to `/u/` |
| `src/components/NotificationItem.tsx` | Update link function from `/profile/` to `/u/` |
| `src/pages/LandingPage.tsx` | Update copyright to 2026 |
| `src/components/RightSidebar.tsx` | Update copyright to 2026 |

---

## Testing Checklist

After implementation, verify:
1. Like a post → Notification appears for post author
2. Boost a post → Notification appears for post author
3. Follow a user → Notification appears for followed user
4. Send a DM → Notification appears for recipient
5. Click notification → Navigates to correct `/u/username` page
6. Search for user → Click navigates to `/u/username`
7. Click author on post → Navigates to `/u/username`
8. Realtime: New notification appears without page refresh

