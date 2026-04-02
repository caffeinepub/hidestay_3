import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@tanstack/react-router";
import { Building2, ChevronDown, Home, LogOut, User } from "lucide-react";
import { Variant_admin_owner_student } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useIsAdmin } from "../hooks/useQueries";

export default function Navbar() {
  const { login, clear, identity, loginStatus } = useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();
  const router = useRouter();

  const isLoggedIn = !!identity;
  const isOwner = profile?.role === Variant_admin_owner_student.owner;
  const isStudent = profile?.role === Variant_admin_owner_student.student;
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    await login();
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-display font-bold text-xl text-primary"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4 text-primary-foreground" />
            </div>
            <span>Hidestay</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/search"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.search.link"
            >
              Browse Properties
            </Link>
            {isLoggedIn && isStudent && (
              <Link
                to="/my-bookings"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="nav.bookings.link"
              >
                My Bookings
              </Link>
            )}
            {isLoggedIn && isOwner && (
              <>
                <Link
                  to="/owner/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="nav.owner.dashboard.link"
                >
                  Dashboard
                </Link>
                <Link
                  to="/owner/listings"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="nav.owner.listings.link"
                >
                  My Listings
                </Link>
              </>
            )}
            {isLoggedIn && isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="nav.admin.dashboard.link"
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  data-ocid="nav.login.button"
                >
                  {isLoggingIn ? "Signing in..." : "Sign In"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.navigate({ to: "/search" })}
                  data-ocid="nav.cta.button"
                >
                  Find a Stay
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    data-ocid="nav.user.dropdown"
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {profile?.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">
                      {profile?.name ?? "User"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => router.navigate({ to: "/auth/setup" })}
                    data-ocid="nav.profile.button"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem
                      onClick={() =>
                        router.navigate({ to: "/owner/dashboard" })
                      }
                      data-ocid="nav.owner.menu.item"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Owner Dashboard
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() =>
                        router.navigate({ to: "/admin/dashboard" })
                      }
                      data-ocid="nav.admin.menu.item"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => clear()}
                    className="text-destructive"
                    data-ocid="nav.logout.button"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
