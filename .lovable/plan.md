
# Comprehensive Feature Implementation Plan

## Overview
This plan addresses 9 major areas: fixing build errors, static pages, page transitions, navigation UI testing, trending news revamp with article modal, hashtag/mention support enhancement, read receipts and typing indicators, notification system revamp, auth flow redesign, and color palette selector.

---

## Phase 1: Fix Critical Build Error (IMMEDIATE)

### Issue: Syntax Error in formatters.ts
The file `src/lib/formatters.ts` line 10 has invalid syntax:
```typescript
export function formatHandle(user.username): string {  // BROKEN
```

### Fix:
```typescript
export function formatHandle(username: string): string {
  return `@${username}`;
}
```

### Files to Update:
| File | Change |
|------|--------|
| `src/lib/formatters.ts` | Fix function parameter syntax |
| `src/components/PostCard.tsx` | Update `formatHandle(author.username, author.instance)` to `formatHandle(author.username)` |

---

## Phase 2: Static Pages (About, Terms, Privacy)

### New Files to Create:
1. `src/pages/AboutPage.tsx` - Company mission, team, values
2. `src/pages/TermsPage.tsx` - Terms of Service 
3. `src/pages/PrivacyPage.tsx` - Privacy Policy

### Design (M3 Expressive):
- Consistent header with back navigation
- Rich typography with `text-display-medium`, `text-headline-large`
- Scroll-friendly layout with section anchors
- Footer links to other legal pages

### Route Updates in App.tsx:
```typescript
<Route path="/about" element={<AboutPage />} />
<Route path="/terms" element={<TermsPage />} />
<Route path="/privacy" element={<PrivacyPage />} />
```

---

## Phase 3: Smooth Page Transitions

### Approach: CSS + React Router
Create a transition wrapper component using CSS animations (avoiding heavy library dependencies).

### New File: `src/components/PageTransition.tsx`
```typescript
// Wraps page content with fade/slide animations
export function PageTransition({ children }) {
  return (
    <div className="animate-page-enter">
      {children}
    </div>
  );
}
```

### Animation Additions to tailwind.config.ts:
```typescript
keyframes: {
  'page-enter': {
    '0%': { opacity: '0', transform: 'translateY(8px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' }
  },
  'page-exit': {
    '0%': { opacity: '1', transform: 'translateY(0)' },
    '100%': { opacity: '0', transform: 'translateY(-8px)' }
  }
}
```

### Integration:
- Wrap each page component with `<PageTransition>`
- Apply to MainLayout outlet

---

## Phase 4: Navigation UI Testing & Fixes

### Current Navigation Components:
1. `AppSidebar.tsx` - Desktop left sidebar
2. `MobileBottomNav.tsx` - Mobile bottom navigation
3. `MobileHeader.tsx` - Mobile top header

### Testing Checklist:
- Verify all routes navigate correctly
- Check badge counts update in real-time
- Confirm active states show properly
- Test FAB compose button functionality

### Potential Issues to Fix:
1. `MobileBottomNav` shows badge on both Messages AND Alerts using same `unreadCount` - needs separate message unread count
2. Theme toggle in AppSidebar uses local state - should persist to localStorage

### Fixes:
| Component | Issue | Fix |
|-----------|-------|-----|
| `MobileBottomNav.tsx` | Same badge for messages/notifications | Add separate unread counts |
| `AppSidebar.tsx` | Theme doesn't persist | Use localStorage + useEffect sync |

---

## Phase 5: Trending News Revamp with Article Modal

### Current State:
- `TrendingNews.tsx` opens links directly in new tab
- No modal view for articles

### New Components:
1. `src/components/NewsArticleModal.tsx` - Full article view modal
2. Update `TrendingNews.tsx` - Click opens modal instead of external link

### Modal Features (M3 Expressive):
- Large rounded dialog (`rounded-3xl`)
- Trust badge prominently displayed with color-coded bias indicator
- Credibility meter at top
- Full article title + description
- "Read full article" button to external source
- Share and save actions

### Visual Design:
```text
+---------------------------------------+
|  [X]                      Trust: 92   |
|  ┌─────────────────────────────────┐  |
|  │  ░░ BIAS: CENTER ░░             │  |
|  │  ████████████████████░░░ 92/100 │  |
|  └─────────────────────────────────┘  |
|                                       |
|  📰 Reuters                           |
|  ─────────────────────────────────    |
|  [Article Title - Bold, Large]        |
|                                       |
|  [Full description text here with     |
|   proper formatting and readability]  |
|                                       |
|  Published: 2 hours ago               |
|                                       |
|  ┌────────────────────────────────┐   |
|  │  🔗 Read Full Article →        │   |
|  └────────────────────────────────┘   |
+---------------------------------------+
```

---

## Phase 6: Enhanced Hashtag & Mention Support

### Current State:
- `ParsedContent.tsx` already parses hashtags and mentions
- Hashtags link to `/search?q=#tag`
- Mentions link to `/u/username`

### Enhancements:
1. **Autocomplete on Compose** - When typing `#` or `@`, show suggestions
2. **Hashtag Trending** - Track popular hashtags
3. **Mention Notifications** - Create notification when mentioned

### New Components:
1. `src/components/MentionAutocomplete.tsx` - Dropdown for @mentions
2. `src/components/HashtagAutocomplete.tsx` - Dropdown for #hashtags

### Database Changes:
```sql
-- Create hashtags tracking table
CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mention notification trigger
CREATE OR REPLACE FUNCTION notify_on_mention()
RETURNS trigger AS $$
DECLARE
  mentioned_username TEXT;
  mentioned_profile_id UUID;
BEGIN
  -- Extract mentions from post content
  FOR mentioned_username IN 
    SELECT (regexp_matches(NEW.content, '@(\w+)', 'g'))[1]
  LOOP
    SELECT id INTO mentioned_profile_id 
    FROM profiles WHERE username = mentioned_username;
    
    IF mentioned_profile_id IS NOT NULL AND mentioned_profile_id != NEW.author_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
      VALUES (mentioned_profile_id, NEW.author_id, 'mention', NEW.id);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';
```

### Files to Update:
| File | Change |
|------|--------|
| `ComposeModal.tsx` | Add autocomplete integration |
| `NotificationItem.tsx` | Add 'mention' type handling |
| `lib/api.ts` | Add 'mention' to NotificationType |

---

## Phase 7: Read Receipts & Typing Indicators

### Read Receipts

#### Database Changes:
```sql
-- Add read_at column to messages
ALTER TABLE messages ADD COLUMN read_at TIMESTAMPTZ;

-- RLS policy for updating read status
CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.profile_id = auth.uid()
  )
)
WITH CHECK (sender_id != auth.uid());
```

#### UI Changes:
- Show double checkmark (✓✓) when message is read
- Single checkmark (✓) when delivered but unread
- Update `ChatMessageItem.tsx` to display status

### Typing Indicators (Animated Blob)

#### Implementation:
Use Supabase Realtime Presence for typing state.

#### New Component: `src/components/TypingIndicator.tsx`
```typescript
// Animated blob with 3 bouncing dots
export function TypingIndicator({ username }: { username: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span className="text-sm text-muted-foreground">{username} is typing</span>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
```

#### Animation (add to index.css):
```css
@keyframes typing-blob {
  0%, 60%, 100% { transform: scale(1); opacity: 0.4; }
  30% { transform: scale(1.3); opacity: 1; }
}

.typing-blob {
  animation: typing-blob 1.4s ease-in-out infinite;
}

.typing-blob:nth-child(2) { animation-delay: 0.2s; }
.typing-blob:nth-child(3) { animation-delay: 0.4s; }
```

#### Hook Update: `use-realtime-chat.tsx`
```typescript
// Add typing presence
const [typingUsers, setTypingUsers] = useState<string[]>([]);

// Track presence for typing
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  const typing = Object.values(state)
    .flat()
    .filter(p => p.typing && p.username !== username)
    .map(p => p.username);
  setTypingUsers(typing);
});

// Broadcast typing state
const setTyping = (isTyping: boolean) => {
  channel.track({ typing: isTyping, username });
};
```

---

## Phase 8: Notification System Revamp

### Database Alignment

#### Current RLS Issues:
The notifications table needs proper UPDATE policy for marking as read.

#### Migration:
```sql
-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Add 'mention' type to notifications (if not exists via check constraint update)
-- Note: Check if constraint exists, otherwise add mention type
```

### UI Revamp (M3 Expressive)

#### Enhanced `NotificationsPage.tsx`:
- Segmented tabs: All | Mentions | Likes | Follows
- Swipe to dismiss (mark as read)
- Grouped by time (Today, Yesterday, This Week)
- Empty states with illustrations

#### Notification Types Config Update:
```typescript
const notificationConfig = {
  // ... existing types
  mention: {
    icon: AtSign,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    getText: () => "mentioned you in a post",
    getLink: (username: string, entityId: string) => `/post/${entityId}`,
  },
  reply: {
    icon: MessageCircle,
    color: "text-teal-500", 
    bgColor: "bg-teal-500/10",
    getText: () => "replied to your post",
    getLink: (username: string, entityId: string) => `/post/${entityId}`,
  },
};
```

---

## Phase 9: Remove Landing Page, Show Auth Directly

### Route Changes in App.tsx:
```typescript
// Before
<Route path="/" element={<LandingPage />} />

// After  
<Route path="/" element={<AuthRoute><AuthPage /></AuthRoute>} />
```

### AuthPage Updates:
- Remove "Back" button since it's now the root
- Add subtle branding/features showcase in background
- Keep the M3 Expressive styling

### Keep Landing Page Accessible:
- Move to `/welcome` for marketing purposes
- Or remove entirely if not needed

---

## Phase 10: Color Palette Selector

### Approach:
Allow users to select from predefined M3 Expressive color themes.

### Theme Options:
1. **Coral Sunset** (default) - Coral primary, teal secondary
2. **Ocean Breeze** - Blue primary, cyan secondary
3. **Forest Glow** - Green primary, amber secondary
4. **Lavender Dreams** - Purple primary, pink secondary
5. **Midnight** - Dark blue primary, gold secondary

### Implementation:

#### New Component: `src/components/ColorPaletteSelector.tsx`
```typescript
const palettes = [
  { name: 'Coral Sunset', primary: '16 90% 50%', secondary: '175 60% 35%' },
  { name: 'Ocean Breeze', primary: '210 90% 50%', secondary: '180 70% 40%' },
  { name: 'Forest Glow', primary: '145 70% 40%', secondary: '42 100% 50%' },
  { name: 'Lavender Dreams', primary: '270 80% 60%', secondary: '330 80% 60%' },
  { name: 'Midnight', primary: '230 80% 50%', secondary: '45 100% 55%' },
];
```

#### Settings Page Integration:
Add new "Theme" section with color swatches user can tap.

#### Persistence:
- Store selection in localStorage
- Apply on app load via useEffect in App.tsx
- Update CSS variables dynamically

#### CSS Variable Updates:
```typescript
const applyPalette = (palette: Palette) => {
  document.documentElement.style.setProperty('--primary', palette.primary);
  document.documentElement.style.setProperty('--secondary', palette.secondary);
  // ... update related variables
  localStorage.setItem('koa-palette', palette.name);
};
```

---

## Files Summary

### New Files (13):
| File | Purpose |
|------|---------|
| `src/pages/AboutPage.tsx` | About page |
| `src/pages/TermsPage.tsx` | Terms of service |
| `src/pages/PrivacyPage.tsx` | Privacy policy |
| `src/components/PageTransition.tsx` | Page transition wrapper |
| `src/components/NewsArticleModal.tsx` | News article modal |
| `src/components/TypingIndicator.tsx` | Typing indicator blob |
| `src/components/MentionAutocomplete.tsx` | @ mention suggestions |
| `src/components/HashtagAutocomplete.tsx` | # hashtag suggestions |
| `src/components/ColorPaletteSelector.tsx` | Theme color picker |
| `src/hooks/useTypingPresence.tsx` | Typing state management |
| `src/hooks/useTheme.tsx` | Theme persistence hook |
| `src/lib/palettes.ts` | Color palette definitions |

### Modified Files (15+):
| File | Changes |
|------|---------|
| `src/lib/formatters.ts` | Fix syntax error |
| `src/components/PostCard.tsx` | Fix formatHandle call |
| `src/App.tsx` | Add routes, update root path |
| `src/pages/AuthPage.tsx` | Remove back button |
| `src/components/TrendingNews.tsx` | Add modal integration |
| `src/components/realtime-chat.tsx` | Add typing indicator |
| `src/hooks/use-realtime-chat.tsx` | Add presence tracking |
| `src/components/chat-message.tsx` | Add read receipt icons |
| `src/pages/NotificationsPage.tsx` | Add tabs, grouping |
| `src/components/NotificationItem.tsx` | Add mention type |
| `src/lib/api.ts` | Add mention type |
| `src/pages/SettingsPage.tsx` | Add color selector section |
| `src/components/ComposeModal.tsx` | Add autocomplete |
| `tailwind.config.ts` | Add new animations |
| `src/index.css` | Add typing blob animation |

### Database Migrations (2):
1. Hashtag tracking + mention notifications
2. Message read receipts + notification RLS fixes

---

## Technical Considerations

### Security:
- All new database triggers use `SECURITY DEFINER SET search_path = 'public'`
- RLS policies properly scoped to authenticated users
- Mention extraction uses safe regex in database function

### Performance:
- Typing indicators use Supabase Presence (lightweight)
- Read receipts batched updates
- Autocomplete debounced (300ms delay)

### Accessibility:
- All new modals have proper focus management
- Color contrast maintained in all palettes
- Animations respect `prefers-reduced-motion`

---

## Testing Plan

After implementation, verify:
1. Build succeeds without errors
2. All navigation links work correctly
3. Page transitions are smooth
4. News modal opens and displays correctly with trust badges
5. Typing indicator appears when other user types
6. Read receipts show correctly (single/double check)
7. Mentions create notifications
8. Hashtags are parsed and linked
9. Auth page works as root route
10. Color palette changes persist across sessions
11. All notification types display correctly
12. Static pages render with proper styling
