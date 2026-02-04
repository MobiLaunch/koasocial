
# Fix User Profile Routing Issue

## Root Cause Analysis

The user profile pages are returning 404 errors because of a **React Router v6 limitation** with dynamic route segments.

### The Problem

The current route definition is:
```jsx
<Route path="/@:username" element={<UserProfilePage />} />
```

In React Router v6.5+, **dynamic parameters (`:param`) must be the full URL segment**. The path `/@:username` is invalid because:
- `@` is a static prefix
- `:username` is a dynamic parameter
- These are combined into a single segment, which is not allowed

This causes the route to never match, and the catch-all `*` route renders the 404 page instead.

**Evidence**:
- GitHub Issue #8699: "Can't start route with @ within Layout Routes"
- Stack Overflow: "dynamic parameters (`:param`) are required to be full url segments"
- React Router v6.5 release notes explicitly removed support for "partial params" like `/@:param`

---

## Solution Options

### Option A: Use Full Segment Dynamic Route (Recommended)
Change the route to `/:username` and handle the `@` prefix in the component and links.

**Pros:**
- Works with React Router v6.5+ constraints
- Keeps the Twitter-like `@username` display in URLs
- Minimal changes to existing link structure

**Cons:**
- Need to ensure route doesn't conflict with other top-level routes like `/home`, `/search`, etc.

### Option B: Use Different Path Structure
Change to `/u/:username` or `/profile/:username`.

**Pros:**
- Clear, unambiguous routing
- No special character handling

**Cons:**
- Changes the URL pattern, which may affect user expectations
- Need to update all links across the app

---

## Recommended Implementation (Option A)

### Step 1: Update Route Definition
Change from:
```jsx
<Route path="/@:username" element={<UserProfilePage />} />
```

To:
```jsx
<Route path="/:username" element={<UserProfilePage />} />
```

### Step 2: Add Route Order Safeguard
Move the `/:username` route to the END of the child routes to ensure specific routes match first. React Router v6 uses a scoring system, but explicit ordering helps with clarity:

```jsx
<Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
  <Route path="/home" element={<HomePage />} />
  <Route path="/public" element={<PublicPage />} />
  <Route path="/search" element={<SearchPage />} />
  <Route path="/messages" element={<MessagesPage />} />
  <Route path="/notifications" element={<NotificationsPage />} />
  <Route path="/profile" element={<ProfilePage />} />
  <Route path="/profile/edit" element={<ProfileEditPage />} />
  <Route path="/settings" element={<SettingsPage />} />
  {/* Dynamic username route LAST - matches any path like /@username or /username */}
  <Route path="/:username" element={<UserProfilePage />} />
</Route>
```

### Step 3: Update UserProfilePage Component
Modify the component to handle both `@username` and `username` formats:

```typescript
export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  
  // Strip leading @ if present (e.g., "@jordan" -> "jordan")
  const cleanUsername = username?.replace(/^@/, "") || "";
  
  // Remove the unused isUuid check since federation was removed
  // ... rest of component stays the same
}
```

### Step 4: Keep Existing Links (No Change Required)
The existing links use `/@${username}` format (e.g., `/@jordan`). When clicked:
1. Browser navigates to `/@jordan`
2. Route `/:username` matches with `username = "@jordan"`
3. Component strips the `@` to get `"jordan"`
4. Profile is fetched using `"jordan"`

**Files with links that remain unchanged:**
- `src/components/PostCard.tsx` - `to={/@${author.username}}`
- `src/pages/SearchPage.tsx` - `to={/@${user.username}}`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Change route path from `/@:username` to `/:username` and reorder to be last |
| `src/pages/UserProfilePage.tsx` | Clean up unused `isUuid` variable, ensure `@` is stripped from param |

---

## Technical Details

### Route Matching Verification
With `/:username` route, React Router will match:
- `/jordan` - matches, username = "jordan"
- `/@jordan` - matches, username = "@jordan"
- `/home` - does NOT match (specific routes have higher priority)
- `/profile/edit` - does NOT match (more specific path wins)

React Router v6 uses a ranking algorithm that gives higher scores to:
1. More static segments (`/profile/edit` beats `/:username`)
2. Longer paths
3. Non-index routes over index routes

### Edge Case: Usernames That Match Routes
If a user has a username like "home" or "settings", navigating to `/home` would match the `/home` route, not the `/:username` route. This is actually correct behavior - we want the app routes to take precedence.

If a user's username conflicts with an app route:
- They can still be accessed via `/@home` (becomes username = "@home", stripped to "home")
- The search page links use `/@${username}` which avoids conflicts

---

## Summary

The fix is straightforward:
1. Change route from `/@:username` to `/:username`
2. Ensure the route is ordered last among siblings (React Router handles this automatically, but ordering is clearer)
3. Strip leading `@` in the component when parsing the username

This aligns with React Router v6.5+ requirements where dynamic segments must be complete path segments.
