# Hidestay — Phase 1: UI Polish, Student Profile Page, Bottom Nav & Dark Mode

## Current State
- Full-stack student rental marketplace with student/owner/admin role flows
- Students can search, book (visit/paid), wishlist, view notifications, subscribe to alerts, submit reviews/reports
- Owner dashboard with listings, leads, bookings overview, notifications, ID verification
- Super Admin panel with analytics, payments, reports, announcements, user/listing management
- Auth: simulated mobile OTP for students/owners, email+password+2FA for admins
- Navbar: desktop nav with role-based links; no bottom navigation for mobile
- No dedicated student profile page (bookings/wishlist/alerts scattered across separate pages)
- No dark mode toggle
- No referral/coupon/points system yet
- main.tsx wraps app in QueryClientProvider + InternetIdentityProvider but MISSING AuthProvider

## Requested Changes (Diff)

### Add
- Student Profile Page (`/student/profile`) — tabs: Overview, My Bookings, Wishlist, My Alerts, Settings
  - Overview: name, phone, edit profile, account info
  - My Bookings: list of all bookings with status badges and cancel actions
  - Wishlist: saved properties grid
  - My Alerts: saved search subscriptions
  - Settings: dark mode toggle, notification toggle, logout
- Bottom Navigation Bar (mobile only, students only) — 4 tabs: Home, Search, Wishlist, Profile
- Dark mode: toggle stored in localStorage, applies `dark` class to `<html>`, works for both students and owners
- Skeleton loaders on LandingPage, SearchPage, WishlistPage while data loads
- Dark mode context/hook: `useDarkMode` — wraps localStorage read/write and applies class to document root
- AuthProvider added to main.tsx (permanent fix)

### Modify
- `main.tsx`: wrap app in `<AuthProvider>` (permanent fix between QueryClientProvider and InternetIdentityProvider)
- `Navbar.tsx`: add link to `/student/profile` for students; add dark mode toggle button for student/owner roles; hide desktop nav links that are now in Profile tabs (keep Browse Properties)
- `routeTree.tsx`: add `/student/profile` route
- `index.css`: ensure `.dark` class variables are present (already exists, verify)
- `WishlistPage.tsx`: add Skeleton loading states
- `SearchPage.tsx`: add Skeleton loading states

### Remove
- Nothing removed; links are consolidated into Profile page, original routes remain accessible

## Implementation Plan
1. Add `AuthProvider` to `main.tsx` — wrap between QueryClientProvider and InternetIdentityProvider
2. Create `useDarkMode` hook — reads/writes `hidestay_dark_mode` localStorage key, applies `.dark` class to `document.documentElement`
3. Create `StudentProfilePage` (`/student/profile`) — tabbed layout with Overview, My Bookings, Wishlist, My Alerts, Settings
4. Update `routeTree.tsx` — add studentProfileRoute at `/student/profile`
5. Update `Navbar.tsx` — add Profile link for students, dark mode toggle button (moon/sun icon) for student/owner
6. Create `BottomNav` component — mobile-only (hidden md:hidden), shown only for students: Home/Search/Wishlist/Profile tabs with active state
7. Update `routeTree.tsx` root layout — include BottomNav below main content, add `pb-20 md:pb-0` to main to account for bottom nav height on mobile
8. Add proper Skeleton loaders to LandingPage, SearchPage, WishlistPage
