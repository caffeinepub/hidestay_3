# Hidestay

## Current State
Phase 1 (UI/UX Polish) is live: Student profile page with 5 tabs (Overview, My Bookings, Wishlist, Alerts, Settings), bottom navigation for students, dark mode toggle for students and owners, AuthProvider permanently in main.tsx. All previous features are live: Stripe paid booking, free visit booking, notifications, reviews, trust/ID verification, admin panel.

Backend already has: property CRUD, bookings (pending/paid/cancelled/rejected), Stripe checkout/refund, notifications, wishlist, reviews, reports, announcements, analytics, user profiles.

## Requested Changes (Diff)

### Add
- **Referral System (backend):** Each user gets a unique referral code stored in their profile. New users can enter a referral code during signup. Referrer earns 10 points per successful referral. New user gets a 10% discount coupon on first paid booking.
- **Points/Rewards System (backend):** Points per user stored in backend. Earn 10 points for first booking, 10 points per referral. When points balance reaches 800+ (₹800 threshold), student can request payout. Admin can approve/reject payout requests.
- **Coupon System (backend):** Admin creates promo codes with 10% discount. Coupons are applied to paid Stripe bookings. One coupon per booking. Coupon can be single-use or multi-use. Backend validates and marks coupon as used.
- **Referral Page** (`/student/referral`): Shows user's unique referral code, copy button, referral count, cashback earned. Link from student profile Settings tab.
- **Rewards Page** (`/student/rewards`): Shows points balance, payout request button (active at ₹800+), payout history. Link from student profile.
- **Coupon Apply UI**: Input field in BookingPage for paid bookings to apply a coupon code. Shows discount and final price.
- **Admin Coupon Management** (`/admin/coupons`): Admin can create, view, and deactivate coupons/promo codes.
- **Admin Payout Management** (`/admin/payouts`): Admin can approve or reject student payout requests.
- **Profile referral code input**: During signup (ProfileSetupPage), add optional "Referral code" field.

### Modify
- `main.mo`: Add referral code, points, coupon, and payout types and logic.
- `BookingPage.tsx`: Add coupon code input for paid bookings, show discount, update Stripe session price.
- `StudentProfilePage.tsx`: Add Referral and Rewards links/cards in Overview tab.
- `ProfileSetupPage.tsx`: Add optional referral code input field.
- `routeTree.tsx`: Add routes for `/student/referral`, `/student/rewards`, `/admin/coupons`, `/admin/payouts`.
- `AdminDashboardPage.tsx`: Add quick links to Coupons and Payouts pages.
- `Navbar.tsx`: No changes needed.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `main.mo` to add:
   - `ReferralCode` type, `referralCodes` map (code → principal), auto-generate code on profile save
   - `pointsMap` (principal → Nat) for reward points
   - `PayoutRequest` type and `payoutRequests` map
   - `Coupon` type and `couponMap` (code → Coupon)
   - Backend functions: `generateReferralCode`, `applyReferralCode`, `getUserPoints`, `requestPayout`, `getPayoutRequests`, `approvePayoutRequest`, `rejectPayoutRequest`, `createCoupon`, `getCoupons`, `validateCoupon`, `useCoupon`, `deactivateCoupon`
2. Re-generate backend bindings.
3. Build frontend:
   - `StudentReferralPage.tsx` at `/student/referral`
   - `StudentRewardsPage.tsx` at `/student/rewards`
   - `AdminCouponsPage.tsx` at `/admin/coupons`
   - `AdminPayoutsPage.tsx` at `/admin/payouts`
   - Update `BookingPage.tsx` to add coupon input for paid bookings
   - Update `StudentProfilePage.tsx` to show referral/rewards cards
   - Update `ProfileSetupPage.tsx` to add referral code input
   - Update `routeTree.tsx` with new routes
   - Update `AdminDashboardPage.tsx` quick links
4. Validate (typecheck + build) and deploy.
