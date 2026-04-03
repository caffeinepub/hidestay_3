import {
  Outlet,
  createRootRoute,
  createRoute,
  type createRouter,
} from "@tanstack/react-router";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import BookingPage from "./pages/BookingPage";
import LandingPage from "./pages/LandingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import PaymentCancelPage from "./pages/PaymentCancelPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import SearchPage from "./pages/SearchPage";
import WishlistPage from "./pages/WishlistPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminCreatePage from "./pages/admin/AdminCreatePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminForgotPasswordPage from "./pages/admin/AdminForgotPasswordPage";
import AdminListingsPage from "./pages/admin/AdminListingsPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminResetPasswordPage from "./pages/admin/AdminResetPasswordPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminStripePage from "./pages/admin/AdminStripePage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import OTPVerifyPage from "./pages/auth/OTPVerifyPage";
import PhoneEntryPage from "./pages/auth/PhoneEntryPage";
import ProfileSetupPage from "./pages/auth/ProfileSetupPage";
import RoleSelectionPage from "./pages/auth/RoleSelectionPage";
import CreateListingPage from "./pages/owner/CreateListingPage";
import EditListingPage from "./pages/owner/EditListingPage";
import ListingBookingsPage from "./pages/owner/ListingBookingsPage";
import OwnerDashboardPage from "./pages/owner/OwnerDashboardPage";
import OwnerListingsPage from "./pages/owner/OwnerListingsPage";

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
});

const propertyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/property/$id",
  component: PropertyDetailPage,
});

const bookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/booking/$propertyId",
  component: BookingPage,
});

const myBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-bookings",
  component: MyBookingsPage,
});

const wishlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wishlist",
  component: WishlistPage,
});

// Auth routes
const authRoleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/role",
  component: RoleSelectionPage,
});

const authPhoneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/phone",
  component: PhoneEntryPage,
});

const authOtpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/otp",
  component: OTPVerifyPage,
});

const authProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/profile",
  component: ProfileSetupPage,
});

// Keep old /auth/setup for backward compat
const authSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/setup",
  component: ProfileSetupPage,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment/success",
  component: PaymentSuccessPage,
});

const paymentCancelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment/cancel",
  component: PaymentCancelPage,
});

const ownerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/owner/dashboard",
  component: OwnerDashboardPage,
});

const ownerListingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/owner/listings",
  component: OwnerListingsPage,
});

const createListingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/owner/listings/new",
  component: CreateListingPage,
});

const editListingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/owner/listings/$id/edit",
  component: EditListingPage,
});

const listingBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/owner/listings/$id/bookings",
  component: ListingBookingsPage,
});

// Admin auth routes
const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});

const adminForgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/forgot-password",
  component: AdminForgotPasswordPage,
});

const adminResetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/reset-password",
  component: AdminResetPasswordPage,
});

const adminCreateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/create",
  component: AdminCreatePage,
});

// Admin dashboard routes
const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: AdminDashboardPage,
});

const adminListingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/listings",
  component: AdminListingsPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/users",
  component: AdminUsersPage,
});

const adminBookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/bookings",
  component: AdminBookingsPage,
});

const adminStripeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/stripe",
  component: AdminStripePage,
});

const adminReviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/reviews",
  component: AdminReviewsPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  searchRoute,
  propertyRoute,
  bookingRoute,
  myBookingsRoute,
  wishlistRoute,
  // Auth
  authRoleRoute,
  authPhoneRoute,
  authOtpRoute,
  authProfileRoute,
  authSetupRoute,
  paymentSuccessRoute,
  paymentCancelRoute,
  // Owner
  ownerDashboardRoute,
  ownerListingsRoute,
  createListingRoute,
  editListingRoute,
  listingBookingsRoute,
  // Admin auth
  adminLoginRoute,
  adminForgotPasswordRoute,
  adminResetPasswordRoute,
  adminCreateRoute,
  // Admin dashboard
  adminDashboardRoute,
  adminListingsRoute,
  adminUsersRoute,
  adminBookingsRoute,
  adminStripeRoute,
  adminReviewsRoute,
]);

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
