# Hidestay - Owner Panel & Property Management System

## Current State

Hidestay is a student rental marketplace. The app has:
- Student, Owner, and Admin roles with mobile OTP auth
- Existing owner pages: OwnerDashboardPage (stats + quick links), OwnerListingsPage (table view), CreateListingPage (form), EditListingPage, ListingBookingsPage
- Backend: `listProperty`, `updateProperty`, `getProperties`, `getPropertyBookings`, `getBookings` etc.
- blob-storage, stripe, authorization, user-approval, http-outcalls already integrated
- No lead/inquiry system, no in-app notifications, no dedicated lead management

## Requested Changes (Diff)

### Add
- **Lead/Inquiry system** in backend: store inquiries (student name, phone, property ID, type: bookVisit/contactOwner, status: pending/accepted/rejected, timestamp)
- **Notification system** in backend: store notifications per owner (message, timestamp, read status)
- **Owner Leads Page** (`/owner/leads`): list all student inquiries for owner's properties with accept/reject actions and click-to-call
- **Owner Notifications** (`/owner/notifications`): bell icon in owner navbar/dashboard, list of notifications with read/unread state
- **Improved Owner Dashboard**: show leads count, pending inquiries stat card, quick link to leads page, notification bell
- **Lead creation hooks**: when student clicks "Book Visit" or "Contact Owner" on PropertyDetailPage, create a lead in the backend (in addition to existing booking flow)
- **Security deposit field** on CreateListingPage and EditListingPage (optional, stored in amenities or as a separate field in description)
- **Availability status toggle** on OwnerListingsPage: owner can mark property as Available/Occupied (stored in amenities array as a tag)
- **Delete property** button on OwnerListingsPage with confirmation dialog

### Modify
- `OwnerDashboardPage`: add Leads stat card, Notifications bell button, link to `/owner/leads`
- `OwnerListingsPage`: add delete button with confirmation, availability toggle
- `CreateListingPage` / `EditListingPage`: add Security Deposit field, Availability Status select
- `Navbar`: add notification bell for owners showing unread count
- `PropertyDetailPage`: when "Book Visit" / "Contact Owner" clicked, also call `createInquiry` backend function
- `routeTree.tsx`: add `/owner/leads` and `/owner/notifications` routes

### Remove
- Nothing removed

## Implementation Plan

1. **Backend**: Add `Inquiry` and `Notification` types. Add `createInquiry`, `getOwnerInquiries`, `updateInquiryStatus`, `getOwnerNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `deleteProperty` functions. When an inquiry is created, auto-create a notification for the property owner.
2. **Frontend hooks** in `useQueries.ts`: `useOwnerInquiries`, `useCreateInquiry`, `useUpdateInquiryStatus`, `useOwnerNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useDeleteProperty`
3. **New page**: `OwnerLeadsPage` at `/owner/leads` — shows all inquiries for owner's properties, with student contact info, property title, type badge, status, accept/reject buttons
4. **New page**: `OwnerNotificationsPage` at `/owner/notifications` — shows all notifications, mark read on view
5. **Update OwnerDashboardPage**: add Leads card, bell icon linking to notifications
6. **Update OwnerListingsPage**: add delete with AlertDialog confirmation, availability toggle (chips in amenities)
7. **Update CreateListingPage/EditListingPage**: add Security Deposit field, Availability status field
8. **Update Navbar**: add bell icon for owners with unread count badge
9. **Update PropertyDetailPage**: wire Book Visit and Contact Owner to also call `createInquiry`
10. **Update routeTree**: add new routes
