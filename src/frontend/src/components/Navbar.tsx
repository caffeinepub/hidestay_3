import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@tanstack/react-router";
import {
  Bell,
  BellRing,
  Building2,
  ChevronDown,
  Heart,
  Home,
  LogOut,
  Megaphone,
  Shield,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  useGetActiveAnnouncements,
  useUnreadNotificationCount,
} from "../hooks/useQueries";
import { getStudentNotifs } from "../pages/StudentNotificationsPage";

function AnnouncementBanner() {
  const { data: announcements } = useGetActiveAnnouncements();
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem("hidestay_dismissed_announcements");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  });

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem(
          "hidestay_dismissed_announcements",
          JSON.stringify([...next]),
        );
      } catch {
        // ignore
      }
      return next;
    });
  }

  const visible = (announcements ?? []).filter(
    (a) => a.isActive && !dismissed.has(a.id.toString()),
  );

  if (visible.length === 0) return null;

  const ann = visible[0];

  return (
    <div
      className="bg-primary text-primary-foreground px-4 py-2 flex items-center gap-3 text-sm"
      data-ocid="nav.announcement.toast"
    >
      <Megaphone className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold">{ann.title}: </span>
        <span className="opacity-90">{ann.message}</span>
      </div>
      <button
        type="button"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1 rounded"
        onClick={() => dismiss(ann.id.toString())}
        aria-label="Dismiss announcement"
        data-ocid="nav.announcement.close.button"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function OwnerNotificationBell() {
  const router = useRouter();
  const { data: unreadCount } = useUnreadNotificationCount();
  const count = Number(unreadCount ?? BigInt(0));
  const display = count > 9 ? "9+" : count.toString();

  return (
    <button
      type="button"
      className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      onClick={() => router.navigate({ to: "/owner/notifications" })}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      data-ocid="nav.owner.notifications.button"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
          {display}
        </span>
      )}
    </button>
  );
}

function StudentNotificationBell({ phone }: { phone: string }) {
  const router = useRouter();
  const notifs = getStudentNotifs(phone);
  const count = notifs.filter((n) => !n.isRead).length;
  const display = count > 9 ? "9+" : count.toString();

  return (
    <button
      type="button"
      className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      onClick={() => router.navigate({ to: "/student/notifications" })}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      data-ocid="nav.student.notifications.button"
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
          {display}
        </span>
      )}
    </button>
  );
}

export default function Navbar() {
  const { session, adminSession, logout, adminLogout, currentRole } = useAuth();
  const router = useRouter();

  const isLoggedIn = !!session || !!adminSession;
  const isStudent = currentRole === "student";
  const isOwner = currentRole === "owner";
  const isAdmin = currentRole === "admin";

  const displayName = adminSession
    ? adminSession.name
    : session
      ? `+91 ${session.phone.slice(-5)}`
      : "";

  const displayInitial = adminSession
    ? (adminSession.name[0]?.toUpperCase() ?? "A")
    : session
      ? session.phone.slice(-2)
      : "U";

  function handleLogout() {
    if (adminSession) {
      adminLogout();
    } else {
      logout();
    }
    router.navigate({ to: "/" });
  }

  return (
    <>
      <AnnouncementBanner />
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 font-display font-bold text-xl text-primary"
              data-ocid="nav.home.link"
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
                <>
                  <Link
                    to="/my-bookings"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    data-ocid="nav.bookings.link"
                  >
                    My Bookings
                  </Link>
                  <Link
                    to="/wishlist"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    data-ocid="nav.wishlist.link"
                  >
                    <Heart className="w-4 h-4" /> Wishlist
                  </Link>
                  <Link
                    to="/student/alerts"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    data-ocid="nav.student.alerts.link"
                  >
                    <BellRing className="w-4 h-4" /> My Alerts
                  </Link>
                  {session && <StudentNotificationBell phone={session.phone} />}
                </>
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
                  <OwnerNotificationBell />
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
                    onClick={() => router.navigate({ to: "/auth/role" })}
                    data-ocid="nav.login.button"
                  >
                    Sign In
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
                          {displayInitial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                        {displayName}
                      </span>
                      {isAdmin && (
                        <Badge
                          variant="secondary"
                          className="text-xs hidden md:flex items-center gap-0.5"
                        >
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </Badge>
                      )}
                      {isOwner && (
                        <Badge
                          variant="secondary"
                          className="text-xs hidden md:flex"
                        >
                          Owner
                        </Badge>
                      )}
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {/* Role indicator */}
                    <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border mb-1">
                      {isAdmin ? (
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Super Admin
                        </span>
                      ) : isOwner ? (
                        <span>Property Owner</span>
                      ) : (
                        <span>Student</span>
                      )}
                    </div>

                    {!isAdmin && (
                      <DropdownMenuItem
                        onClick={() =>
                          router.navigate({
                            to: "/auth/profile",
                            search: {
                              phone: session?.phone,
                              role: session?.role,
                            },
                          })
                        }
                        data-ocid="nav.profile.button"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                    )}
                    {isStudent && (
                      <>
                        <DropdownMenuItem
                          onClick={() => router.navigate({ to: "/wishlist" })}
                          data-ocid="nav.wishlist.menu.item"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          My Wishlist
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.navigate({ to: "/student/notifications" })
                          }
                          data-ocid="nav.student.notifications.menu.item"
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Notifications
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.navigate({ to: "/student/alerts" })
                          }
                          data-ocid="nav.student.alerts.menu.item"
                        >
                          <BellRing className="w-4 h-4 mr-2" />
                          My Alerts
                        </DropdownMenuItem>
                      </>
                    )}
                    {isOwner && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            router.navigate({ to: "/owner/dashboard" })
                          }
                          data-ocid="nav.owner.menu.item"
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          Owner Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.navigate({ to: "/owner/notifications" })
                          }
                          data-ocid="nav.owner.notifications.menu.item"
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Notifications
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            router.navigate({ to: "/admin/dashboard" })
                          }
                          data-ocid="nav.admin.menu.item"
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.navigate({ to: "/admin/create" })
                          }
                          data-ocid="nav.admin.create.item"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Create Admin
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
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
    </>
  );
}
