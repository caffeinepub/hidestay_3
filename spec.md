# Hidestay

## Current State

Hidestay is a student rental marketplace with:
- Internet Identity (ICP) as the primary login mechanism
- Single profile setup page at `/auth/setup` that collects: Name, Email, Phone, Role (Student/Owner)
- Role-based access: Student, Owner, Admin
- Booking, listing, admin pages all functional
- Backend stores `UserProfile` with: name, phone, email, role
- No role-specific extended profile fields
- Admin access controlled via Internet Identity + role assignment

## Requested Changes (Diff)

### Add
- **Mobile OTP Login Flow** (simulated): Replace Internet Identity with mobile number + OTP based authentication
  - Step 1: Role selection page — "I am a Student" / "I am a Property Owner"
  - Step 2: Enter mobile number
  - Step 3: OTP verification screen (simulated — backend generates/validates OTP)
  - Step 4: Profile setup (role-specific fields)
- **Role-Specific Profile Fields**:
  - Student: College Name, Preferred Location, Budget Range, Gender
  - Owner: Business Name, Property Location, ID Proof upload (Aadhaar/PAN — file upload)
- **Separate Admin Login Page** at `/admin/login`:
  - Email + Password login form
  - "Forgot Password" flow (generate reset token, email-free — show reset code in UI since email is disabled)
  - "Create New Admin" form (protected — only existing admin can create)
- **Backend OTP functions**: generateOTP(phone), verifyOTP(phone, otp), getSession
- **Backend Admin Auth**: adminLogin(email, password), adminForgotPassword(email), adminResetPassword(token, newPassword), createAdmin(email, password)
- **Extended UserProfile**: Add college, preferredLocation, budgetMin, budgetMax, gender (for students), businessName, propertyLocation, idProofUrl (for owners)
- **OTP session management**: Store phone-based sessions in backend, map phone to Principal

### Modify
- `UserProfile` type in backend: extend with optional role-specific fields
- `ProfileSetupPage`: Replace with new multi-step registration flow
- `useInternetIdentity` hook: Keep for backend actor calls but auth gating replaced with OTP session
- `Navbar`: Update login/logout to use new mobile auth system
- `RouteGuard`: Update to check OTP session instead of Internet Identity
- Admin pages: Update to check admin email session instead of Internet Identity admin role

### Remove
- Internet Identity as the user-facing login method (kept internally for actor calls, but UI login via mobile OTP)
- "Sign In with Internet Identity" button from all pages

## Implementation Plan

1. **Backend**: Add OTP auth functions, admin email/password auth, extended UserProfile fields, phone-to-principal mapping
2. **Frontend Auth Context**: Create a new `useAuth` hook that manages:
   - OTP-based student/owner sessions stored in localStorage
   - Admin email/password sessions stored in localStorage
3. **New Pages**:
   - `/auth/role` — Role selection
   - `/auth/phone` — Mobile number entry
   - `/auth/otp` — OTP verification
   - `/auth/profile` — Role-specific profile setup (replaces current `/auth/setup`)
   - `/admin/login` — Admin email+password login
   - `/admin/forgot-password` — Forgot password
   - `/admin/reset-password` — Reset password
   - `/admin/create` — Create new admin (admin only)
4. **Update routing**: Add new auth routes, protect admin routes with admin session
5. **Update Navbar**: Show mobile number + logout instead of II identity
