# Hidestay

## Current State
New project. No existing application files.

## Requested Changes (Diff)

### Add
- Full student rental marketplace with 3 role-based flows
- Role-based access control: Student, Owner, Super Admin
- Property listing system with full details (photos, price, room type, amenities, rules, distance from college)
- Student search & filter (location, price, room type, amenities)
- Student direct booking flow with Stripe payment integration
- Owner dashboard: create/edit/delete listings, view bookings
- Super Admin dashboard: approve/reject listings, manage users (ban/approve), handle disputes, feature listings, platform monitoring
- Image uploads for property photos (blob storage)
- Booking management: status tracking (pending, confirmed, cancelled)
- User profiles for students and owners

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- Authorization with roles: student, owner, admin
- Property data model: id, ownerId, title, description, address, city, college, distanceFromCollege, price, roomType (single/double/triple/shared), amenities, rules, photos (blob IDs), status (pending/approved/rejected/featured), createdAt
- Booking data model: id, propertyId, studentId, checkIn, checkOut, totalAmount, status (pending/confirmed/cancelled), stripePaymentId, createdAt
- User profile model: id, role, name, phone, college (for students), isApproved, isBanned
- CRUD APIs for properties (owner-scoped)
- Search/filter API for properties (students)
- Booking APIs: create, confirm, cancel
- Stripe payment initiation and webhook handling
- Admin APIs: approve/reject listings, feature listings, ban/unban users, view disputes
- Dispute model and APIs

### Frontend (React + TypeScript)
- Landing page with search bar and featured properties
- Auth flow with role selection on signup (student/owner)
- Student: property search/filter page, property detail page, booking flow, payment page, my bookings page
- Owner: dashboard, create/edit listing form (with photo upload), manage listings, view bookings
- Super Admin: listings management, user management, disputes panel, platform stats
- Shared: navbar with role-aware navigation, property cards, loading states

### Components
- authorization (role-based access)
- blob-storage (property photos)
- stripe (payment integration)
- user-approval (owner/listing approval)
