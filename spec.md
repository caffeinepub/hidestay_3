# Hidestay - Phase 1 Booking Flow

## Current State

The app already has:
- `BookingPage.tsx` at `/booking/:propertyId` — only does Stripe paid booking (selects dates, enters details, immediately goes to Stripe checkout)
- `MyBookingsPage.tsx` at `/my-bookings` — shows student's booking history
- `AdminBookingsPage.tsx` at `/admin/bookings` — admin view of all bookings
- `ListingBookingsPage.tsx` at `/owner/listings/:id/bookings` — owner view of bookings per property
- Backend: `bookProperty`, `getBookings`, `getUserBookings`, `getPropertyBookings` all exist
- Booking statuses: `pending`, `paid`, `cancelled`, `rejected`

Issue: The current `BookingPage` skips directly to Stripe, making it hard to do a free visit booking. There's no booking type selection, no confirmation screen, and no cancellation UI.

## Requested Changes (Diff)

### Add
- **Booking type selection**: At start of booking flow, student selects "Book a Visit" (free) or "Book Now" (paid via Stripe)
- **Visit Booking flow**: Free, just saves booking with status `pending`, shows confirmation screen
- **Booking confirmation screen**: After submitting (either type), show a summary card with booking details, property name, date, booking type, and a shareable confirmation message
- **Cancellation UI**: In `MyBookingsPage`, add a "Cancel" button on `pending` bookings; calls a cancel action that updates status to `cancelled`
- **`cancelBooking` backend method**: Add to backend if not present
- **Owner bookings section**: In `OwnerDashboardPage`, add a quick-link button to view bookings; update `ListingBookingsPage` to show booking type and allow owner to confirm/reject visits
- **In-app notification to owner**: When a visit booking is made, trigger notification in backend

### Modify
- `BookingPage.tsx`: Add booking type step (visit vs paid), handle visit booking path (no Stripe), show confirmation after booking
- `MyBookingsPage.tsx`: Add cancel button for pending bookings, show booking type label
- `OwnerDashboardPage.tsx`: Add bookings quick-link
- `AdminBookingsPage.tsx`: Show booking type column if available

### Remove
- Nothing removed

## Implementation Plan

1. Check if `cancelBooking` exists in backend; if not, add it to `main.mo`
2. Update `BookingPage.tsx`:
   - Step 1: Choose booking type (Visit = free, Instant = Stripe paid)
   - Step 2: Select date + enter details
   - Step 3: For visit booking → `bookProperty` with status `pending` → show confirmation screen
   - Step 3: For paid booking → `bookProperty` → Stripe checkout (existing flow)
3. Add confirmation screen component inline in `BookingPage` with shareable text
4. Update `MyBookingsPage.tsx`: Add cancel button for `pending` bookings
5. Update `OwnerDashboardPage.tsx`: Add "View Bookings" quick-link
6. Update `ListingBookingsPage.tsx`: Show visit vs paid type, allow confirm/reject
7. Ensure `AuthProvider` / `InternetIdentityProvider` is correctly in `main.tsx` (already present)
