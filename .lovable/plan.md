

## koasocial - Social Media Platform

A warm and friendly social media platform inspired by Mastodon, designed with future ActivityPub federation in mind.

---

### 🎨 Design System

**Visual Identity:**
- Warm, inviting color palette (soft oranges, corals, creams)
- Rounded corners and smooth transitions
- Friendly, approachable typography
- Soft shadows and gentle gradients
- Custom "koasocial" branding throughout

---

### 📱 Core Pages & Components

**1. Landing/Home Page**
- Welcoming hero section with koasocial branding
- Sign in / Sign up buttons (UI only for now)
- Preview of what the platform offers

**2. Main Feed Layout**
- Sidebar navigation with:
  - Home timeline
  - Public/Local timeline
  - Notifications
  - Profile
  - Compose button
- Main content area showing posts
- Right sidebar with trending/suggested content

**3. Timeline Views**
- **Home Timeline**: Posts from followed accounts (mock data)
- **Public Timeline**: All public posts on the platform
- Infinite scroll feel with post cards

**4. Post Component**
- User avatar, display name, username, timestamp
- Post content (text)
- Action bar: Reply, Boost, Favorite, Share
- Reply thread preview
- Boost/reblog indicator

**5. User Profile Page**
- Banner image and avatar
- Display name, username, bio
- Follower/following counts
- Tab navigation: Posts, Replies, Media, Likes
- Follow/unfollow button

**6. Notifications Panel**
- Grouped notifications by type
- Follow notifications
- Like/favorite alerts
- Reply mentions
- Boost notifications

**7. Compose Post Modal**
- Text input with character counter
- Emoji picker placeholder
- Post visibility options (Public, Followers, etc.)
- Post button

---

### 🔮 Future-Ready Architecture

The UI will be structured to support future ActivityPub federation:
- User handles in `@username@instance` format
- Post structure compatible with ActivityPub objects
- Federation indicators in UI (showing where posts originate)

---

### 📦 What's Included (UI Only)

- ✅ Responsive design (mobile & desktop)
- ✅ Dark/light mode toggle
- ✅ Mock data for demonstration
- ✅ All interactions work visually
- ✅ Smooth animations and transitions

---

### 🚀 Next Steps (After UI)

When you're ready to add backend functionality:
1. User authentication with Lovable Cloud
2. Real database for posts, users, follows
3. Real-time notifications
4. Eventually: ActivityPub federation layer

