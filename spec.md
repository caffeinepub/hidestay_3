# Hidestay – Booking & Payment System Phase 2

## Current State
- Phase 1 booking flow is live: free Visit Booking, booking management (student/owner/admin), cancellation, in-app notifications.
- Backend has `bookProperty`, `cancelBooking`, `confirmBooking`, `rejectBooking`, `createCheckoutSession`, `getStripeSessionStatus` endpoints.
- `cancelBooking` only sets status to `#cancelled` – no Stripe refund is issued.
- `BookingPage` already supports choosing visit vs paid, and triggers Stripe checkout for paid bookings.
- `PaymentSuccessPage` polls Stripe session status but does NOT update the booking status to `#paid` after Stripe confirms.
- `main.tsx` is missing `AuthProvider` – recurring blank-screen bug.
- Owner dashboard does not show a unified bookings overview.

## Requested Changes (Diff)

### Add
- Backend: `cancelPaidBooking(bookingId)` – cancels booking AND issues Stripe refund via HTTP outcall to `POST /v1/refunds` with `payment_intent` from the Stripe session.
- Backend: `confirmStripeBooking(bookingId, sessionId)` – sets booking status to `#paid` after Stripe confirms payment.
- Frontend: After `PaymentSuccessPage` confirms `completed`, call `confirmStripeBooking` to update booking status.
- Frontend: In `MyBookingsPage`, show "Cancel & Refund" button for paid bookings with `#paid` status (triggers `cancelPaidBooking`).
- Frontend: Owner dashboard overview section showing all bookings for their properties.

### Modify
- `main.tsx`: Wrap app in `AuthProvider` to fix recurring blank-screen bug.
- `cancelBooking`: Keep as-is for visit (free) bookings.
- `MyBookingsPage`: differentiate cancel actions – visit bookings use `cancelBooking`, paid bookings use `cancelPaidBooking`.
- `PaymentSuccessPage`: After Stripe session `completed`, call `confirmStripeBooking` to sync backend status.

### Remove
- Nothing removed.

## Implementation Plan
1. Fix `main.tsx` – add `AuthProvider` wrapper.
2. Add `cancelPaidBooking` to backend: fetches the Stripe session to get `payment_intent`, calls Stripe Refunds API, sets booking `#cancelled`.
3. Add `confirmStripeBooking` to backend: sets booking status to `#paid`.
4. Update `backend.d.ts` with new method signatures.
5. Update `useQueries.ts` with `useCancelPaidBooking` and `useConfirmStripeBooking` hooks.
6. Update `PaymentSuccessPage` to call `confirmStripeBooking` after Stripe confirms.
7. Update `MyBookingsPage` to show correct cancel button for paid bookings.
8. Add bookings overview tab/section to `OwnerDashboardPage`.
