# Hidestay – Super Admin Panel (Version 8)

## Current State

Hidestay is a student rental marketplace with three roles: Student, Owner, Admin.

- Backend: Motoko with authorization, blob-storage, http-outcalls, stripe, user-approval components.
- Authentication: Simulated OTP for students/owners; email+password for admins stored in localStorage.
- Admin panel already has: `/admin/login`, `/admin/create`, `/admin/dashboard`, `/admin/listings`, `/admin/users`, `/admin/bookings`, `/admin/stripe`, `/admin/reviews`.
- Admin dashboard shows: total properties, approved listings, pending listings, total bookings, approved/pending users.
- Admin listings: view all, approve/reject property listings.
- Admin users: approve/reject owners via user-approval system.
- Admin bookings: view all bookings.
- Admin reviews: moderate (delete) reviews.
- No analytics tracking, no report/complaint system, no announcements, no payment management page, no simulated 2FA, no user block/unblock (only approve/reject), no verified badge on listings.

## Requested Changes (Diff)

### Add
- **Analytics tracking (backend):** Track property views (increment view count per property), track booking conversions, track daily active users (session logs per day).
- **Report/Complaint system (backend + frontend):** New `Report` type stored in backend. "Report this listing" button on `PropertyDetailPage`. Admin panel page `/admin/reports` to review and take action (remove listing / block user).
- **Announcements system (backend + frontend):** Admin can create in-app announcements. Users see announcements in a banner/notification on their next app open. Stored in backend.
- **Payment management page:** `/admin/payments` -- pulls real Stripe transaction data via `http-outcalls` to Stripe API. Shows transaction list with amount, status, customer, date.
- **Simulated 2FA OTP for admin login:** After email+password, show OTP input screen with 6-digit code (same simulated pattern as student OTP). 
- **Block/Unblock users:** In admin users page, add block/unblock action alongside approve/reject. Blocked users cannot log in or perform actions.
- **Verified badge on listings:** Admin can mark a property as "verified" (separate from approved). Verified badge shows on property cards and detail page.
- **Analytics dashboard page:** `/admin/analytics` with charts showing daily active users, most viewed properties, booking conversion rate.
- **New admin quick-link buttons:** Reports, Payments, Analytics added to admin dashboard.
- **"Report this listing" button:** On `PropertyDetailPage`, logged-in users can submit a report with a reason.

### Modify
- **Admin dashboard stats:** Add Total Users count, Active Listings count, Total Leads count to existing stats.
- **Admin listings page:** Add "Verify" button (marks property as verified), "Remove" button (delete listing), filter by status (approved/pending/verified).
- **Admin users page:** Add block/unblock buttons, show user role (student/owner), show profile name.
- **Backend `Property` type:** Add `verified: Bool` and `viewCount: Nat` fields.
- **Backend:** Add analytics tracking functions, report functions, announcement functions, user blocking.
- **`PropertyCard` component:** Show verified badge when property is verified.
- **`main.tsx`:** Ensure `AuthProvider` wraps the app (prevent "something went wrong" bug).
- **routeTree:** Add `/admin/reports`, `/admin/payments`, `/admin/analytics` routes.

### Remove
- Nothing removed.

## Implementation Plan

1. **Backend changes:**
   - Add `verified: Bool` and `viewCount: Nat` to `Property` type.
   - Add `Report` type and `reportsList` map with `submitReport`, `getReports`, `resolveReport` functions.
   - Add `Announcement` type and `announcementsList` map with `createAnnouncement`, `getAnnouncements`, `dismissAnnouncement` functions.
   - Add `blockedUsers` set with `blockUser`, `unblockUser`, `isUserBlocked` functions.
   - Add analytics: `trackPropertyView`, `getPropertyViewCounts`, `trackDailyActiveUser`, `getDailyActiveUsers`, `getAnalyticsSummary` functions.
   - Add `verifyProperty` function (admin only).
   - Add Stripe payment list via http-outcall: `getStripePayments` function.
   - Guard blocked users from performing actions.

2. **Frontend new pages:**
   - `/admin/reports` - AdminReportsPage: table of reports, resolve actions.
   - `/admin/payments` - AdminPaymentsPage: Stripe transaction list.
   - `/admin/analytics` - AdminAnalyticsPage: charts/stats for views, DAU, conversions.

3. **Frontend modifications:**
   - `PropertyDetailPage`: Add "Report this listing" button, call `trackPropertyView` on load.
   - `AdminDashboardPage`: Add new stats (total users, active listings, leads), add quick-link buttons for reports/payments/analytics.
   - `AdminListingsPage`: Add Verify and Remove buttons, filter tabs.
   - `AdminUsersPage`: Add block/unblock, show user name and role.
   - `AdminLoginPage`: Add simulated 2FA step after login.
   - `PropertyCard`: Show verified badge.
   - `useQueries.ts`: Add hooks for new backend functions.
   - `main.tsx`: Ensure `AuthProvider` is present.
   - `routeTree.tsx`: Register new routes.
