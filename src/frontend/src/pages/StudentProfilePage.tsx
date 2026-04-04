import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Building2,
  Calendar,
  CheckCircle2,
  Edit2,
  Gift,
  Heart,
  LogOut,
  MapPin,
  Moon,
  RefreshCw,
  Settings,
  Star,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import PropertyCard from "../components/PropertyCard";
import RouteGuard from "../components/RouteGuard";
import { useAuth } from "../hooks/useAuth";
import { useDarkMode } from "../hooks/useDarkMode";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useApprovedProperties,
  useCancelBooking,
  useCancelPaidBooking,
  useGetUserPoints,
  useMyBookings,
} from "../hooks/useQueries";
import { useWishlist } from "../hooks/useWishlist";
import { type PropertyAlert, getAlerts } from "./StudentAlertsPage";

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const propertyTypeLabels: Record<string, string> = {
  all: "All Types",
  apartment: "PG / Flat",
  sharedRoom: "Shared Room",
  single: "Private Room",
};

function saveAlerts(phone: string, alerts: PropertyAlert[]) {
  localStorage.setItem(`hidestay_alerts_${phone}`, JSON.stringify(alerts));
}

export default function StudentProfilePage() {
  return (
    <RouteGuard requiredRole="student">
      <StudentProfileInner />
    </RouteGuard>
  );
}

function StudentProfileInner() {
  const { session, logout } = useAuth();
  const { identity } = useInternetIdentity();
  const router = useRouter();
  const { isDark, toggleDark } = useDarkMode();

  const phone = session?.phone ?? "";
  const principal = identity?.getPrincipal();

  const { data: bookings, isLoading: bookingsLoading } =
    useMyBookings(principal);
  const cancelMutation = useCancelBooking();
  const cancelPaidMutation = useCancelPaidBooking();
  const { data: points } = useGetUserPoints();

  const { wishlist } = useWishlist(phone);
  const { data: allProperties, isLoading: propertiesLoading } =
    useApprovedProperties();

  const savedProperties = useMemo(() => {
    if (!allProperties || wishlist.length === 0) return [];
    return allProperties.filter((p) => wishlist.includes(p.id.toString()));
  }, [allProperties, wishlist]);

  const [alerts, setAlerts] = useState<PropertyAlert[]>(() => getAlerts(phone));
  const [alertLocation, setAlertLocation] = useState("");
  const [alertPropertyType, setAlertPropertyType] = useState("all");
  const [alertMaxPrice, setAlertMaxPrice] = useState("");

  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [confirmRefundId, setConfirmRefundId] = useState<string | null>(null);

  const notifKey = `hidestay_notifs_enabled_${phone}`;
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(notifKey);
      return raw === null ? true : raw === "true";
    } catch {
      return true;
    }
  });

  function toggleNotif(val: boolean) {
    setNotifEnabled(val);
    try {
      localStorage.setItem(notifKey, val ? "true" : "false");
    } catch {}
  }

  const displayName = session ? `+91 ${phone.slice(-10)}` : "Student";
  const initials = phone ? phone.slice(-2).toUpperCase() : "ST";

  const bookingCount = bookings?.length ?? 0;
  const alertCount = alerts.length;
  const pointsNum = Number(points ?? 0n);

  const handleCancelVisit = async (bookingId: bigint) => {
    try {
      await cancelMutation.mutateAsync(bookingId);
      toast.success("Booking cancelled successfully");
      setConfirmCancelId(null);
    } catch {
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  const handleCancelPaid = async (bookingId: bigint) => {
    try {
      await cancelPaidMutation.mutateAsync(bookingId);
      toast.success("Booking cancelled and refund initiated");
      setConfirmRefundId(null);
    } catch {
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  function handleAddAlert() {
    if (!alertLocation.trim()) {
      toast.error("Please enter a location");
      return;
    }
    const price = Number(alertMaxPrice);
    if (!alertMaxPrice || Number.isNaN(price) || price <= 0) {
      toast.error("Please enter a valid max price");
      return;
    }
    const newAlert: PropertyAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      location: alertLocation.trim(),
      propertyType: alertPropertyType,
      maxPrice: price,
      createdAt: Date.now(),
    };
    const updated = [newAlert, ...alerts];
    setAlerts(updated);
    saveAlerts(phone, updated);
    setAlertLocation("");
    setAlertPropertyType("all");
    setAlertMaxPrice("");
    toast.success("Alert saved!");
  }

  function handleDeleteAlert(id: string) {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(phone, updated);
    toast.success("Alert removed");
  }

  function handleLogout() {
    logout();
    router.navigate({ to: "/" });
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <Avatar className="w-16 h-16 shrink-0">
          <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display font-bold text-2xl">{displayName}</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-medium">
              <User className="w-3 h-3 mr-1" /> Student
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{phone}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() =>
            router.navigate({
              to: "/auth/profile",
              search: { phone: session?.phone, role: session?.role },
            })
          }
          data-ocid="profile.edit.button"
        >
          <Edit2 className="w-3.5 h-3.5 mr-1.5" />
          Edit Profile
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-5 mb-6">
          <TabsTrigger value="overview" data-ocid="profile.overview.tab">
            <User className="w-3.5 h-3.5 mr-1 hidden sm:block" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="bookings" data-ocid="profile.bookings.tab">
            <Calendar className="w-3.5 h-3.5 mr-1 hidden sm:block" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="wishlist" data-ocid="profile.wishlist.tab">
            <Heart className="w-3.5 h-3.5 mr-1 hidden sm:block" />
            Wishlist
          </TabsTrigger>
          <TabsTrigger value="alerts" data-ocid="profile.alerts.tab">
            <Bell className="w-3.5 h-3.5 mr-1 hidden sm:block" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="settings" data-ocid="profile.settings.tab">
            <Settings className="w-3.5 h-3.5 mr-1 hidden sm:block" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          {/* Stats grid: 4 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Card className="shadow-xs">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-3xl font-bold text-primary">
                  {bookingCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Bookings
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-xs">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-3xl font-bold text-primary">
                  {wishlist.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saved Properties
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-xs">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-3xl font-bold text-primary">{alertCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Active Alerts
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-xs">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {pointsNum}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Reward Points
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Referral & Rewards quick actions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary transition-colors cursor-pointer"
              onClick={() => router.navigate({ to: "/student/referral" })}
              data-ocid="profile.referral.button"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                <Gift className="w-5 h-5 text-orange-600" />
              </div>
              <p className="font-semibold text-sm mb-0.5">Refer &amp; Earn</p>
              <p className="text-xs text-muted-foreground">
                Share your referral code, earn points
              </p>
            </button>
            <button
              type="button"
              className="bg-card border border-border rounded-xl p-5 text-left hover:border-primary transition-colors cursor-pointer"
              onClick={() => router.navigate({ to: "/student/rewards" })}
              data-ocid="profile.rewards.button"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-purple-600" />
              </div>
              <p className="font-semibold text-sm mb-0.5">My Rewards</p>
              <p className="text-xs text-muted-foreground">
                Points balance &amp; payout requests
              </p>
            </button>
          </div>

          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-sm">{phone || "—"}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                  Verified
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium text-sm">Student</p>
                  </div>
                </div>
              </div>
              <Separator />
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() =>
                  router.navigate({
                    to: "/auth/profile",
                    search: { phone: session?.phone, role: session?.role },
                  })
                }
                data-ocid="profile.overview.edit.button"
              >
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── My Bookings Tab ── */}
        <TabsContent value="bookings">
          {bookingsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-28 w-full rounded-xl"
                  data-ocid="profile.bookings.loading_state"
                />
              ))}
            </div>
          ) : !bookings || bookings.length === 0 ? (
            <div
              className="text-center py-16 bg-card border border-border rounded-xl"
              data-ocid="profile.bookings.empty_state"
            >
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold mb-1">No bookings yet</p>
              <p className="text-muted-foreground text-sm mb-4">
                Find a property and make your first booking!
              </p>
              <Button
                onClick={() => router.navigate({ to: "/search" })}
                data-ocid="profile.bookings.browse.button"
              >
                Browse Properties
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking, i) => {
                const isPaidBooking = booking.totalPrice > 0n;
                const isPaid = booking.status === "paid";
                const isPending = booking.status === "pending";
                const isCancelled =
                  booking.status === "cancelled" ||
                  booking.status === "rejected";

                const isCancellingThis =
                  cancelMutation.isPending &&
                  confirmCancelId === booking.id.toString();
                const isRefundingThis =
                  cancelPaidMutation.isPending &&
                  confirmRefundId === booking.id.toString();
                const showCancelConfirm =
                  confirmCancelId === booking.id.toString();
                const showRefundConfirm =
                  confirmRefundId === booking.id.toString();

                return (
                  <div
                    key={booking.id.toString()}
                    className="bg-card border border-border rounded-xl p-5 shadow-xs"
                    data-ocid={`profile.bookings.item.${i + 1}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold">
                            Property #{booking.propertyIdText}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              !isPaidBooking
                                ? "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                                : "bg-green-50 text-green-700 border-green-200 text-xs"
                            }
                          >
                            {!isPaidBooking ? "Visit" : "Paid Booking"}
                          </Badge>
                          <Badge
                            className={`text-xs border ${statusColors[booking.status] || ""}`}
                            variant="outline"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {format(
                              Number(booking.startDate / 1_000_000n),
                              "MMM d, yyyy",
                            )}
                            {booking.startDate !== booking.endDate
                              ? ` — ${format(Number(booking.endDate / 1_000_000n), "MMM d, yyyy")}`
                              : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          {!isPaidBooking ? (
                            <p className="font-semibold text-blue-600">Free</p>
                          ) : (
                            <p className="font-bold text-lg">
                              ₹
                              {Number(booking.totalPrice).toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          )}
                        </div>

                        {!isPaidBooking && isPending && !showCancelConfirm && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                            onClick={() =>
                              setConfirmCancelId(booking.id.toString())
                            }
                            data-ocid={`profile.bookings.delete_button.${i + 1}`}
                          >
                            Cancel
                          </Button>
                        )}
                        {isPaidBooking && isPending && !showCancelConfirm && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                            onClick={() =>
                              setConfirmCancelId(booking.id.toString())
                            }
                            data-ocid={`profile.bookings.delete_button.${i + 1}`}
                          >
                            Cancel
                          </Button>
                        )}
                        {isPaidBooking &&
                          isPaid &&
                          !showRefundConfirm &&
                          !isCancelled && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs gap-1"
                              onClick={() =>
                                setConfirmRefundId(booking.id.toString())
                              }
                              data-ocid={`profile.bookings.delete_button.${i + 1}`}
                            >
                              <RefreshCw className="w-3 h-3" /> Cancel & Refund
                            </Button>
                          )}
                      </div>
                    </div>

                    {showCancelConfirm && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 bg-red-50/50 dark:bg-red-950/20 -mx-5 -mb-5 px-5 pb-4 rounded-b-xl">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                        <p className="text-sm flex-1">
                          Are you sure you want to cancel this booking?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setConfirmCancelId(null)}
                            disabled={isCancellingThis}
                            data-ocid={`profile.bookings.cancel_button.${i + 1}`}
                          >
                            No
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleCancelVisit(booking.id)}
                            disabled={isCancellingThis}
                            data-ocid={`profile.bookings.confirm_button.${i + 1}`}
                          >
                            {isCancellingThis ? "Cancelling..." : "Yes, Cancel"}
                          </Button>
                        </div>
                      </div>
                    )}
                    {showRefundConfirm && (
                      <div className="mt-3 pt-3 border-t border-border flex items-center gap-3 bg-red-50/50 dark:bg-red-950/20 -mx-5 -mb-5 px-5 pb-4 rounded-b-xl">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                        <p className="text-sm flex-1">
                          Cancel this booking? Your advance will be refunded.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setConfirmRefundId(null)}
                            disabled={isRefundingThis}
                            data-ocid={`profile.bookings.cancel_button.${i + 1}`}
                          >
                            No
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => handleCancelPaid(booking.id)}
                            disabled={isRefundingThis}
                            data-ocid={`profile.bookings.confirm_button.${i + 1}`}
                          >
                            <RefreshCw className="w-3 h-3" />{" "}
                            {isRefundingThis ? "Processing..." : "Yes, Refund"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Wishlist Tab ── */}
        <TabsContent value="wishlist">
          {propertiesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  className="h-64 w-full rounded-xl"
                  data-ocid="profile.wishlist.loading_state"
                />
              ))}
            </div>
          ) : savedProperties.length === 0 ? (
            <div
              className="text-center py-16 bg-card border border-border rounded-xl"
              data-ocid="profile.wishlist.empty_state"
            >
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold mb-1">No saved properties</p>
              <p className="text-muted-foreground text-sm mb-4">
                Browse properties and tap the heart button to save them here.
              </p>
              <Button
                onClick={() => router.navigate({ to: "/search" })}
                data-ocid="profile.wishlist.browse.button"
              >
                Browse Properties
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savedProperties.map((p, i) => (
                <PropertyCard key={p.id.toString()} property={p} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── My Alerts Tab ── */}
        <TabsContent value="alerts">
          <Card className="shadow-xs mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BellRing className="w-4 h-4 text-primary" /> Add New Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-alert-location">
                    Location / City
                  </Label>
                  <Input
                    id="profile-alert-location"
                    placeholder="e.g. Pune, Koramangala..."
                    value={alertLocation}
                    onChange={(e) => setAlertLocation(e.target.value)}
                    data-ocid="profile.alerts.location.input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-alert-type">Property Type</Label>
                  <Select
                    value={alertPropertyType}
                    onValueChange={setAlertPropertyType}
                  >
                    <SelectTrigger
                      id="profile-alert-type"
                      data-ocid="profile.alerts.type.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="apartment">PG / Flat</SelectItem>
                      <SelectItem value="sharedRoom">Shared Room</SelectItem>
                      <SelectItem value="single">Private Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-alert-price">Max Price (₹/month)</Label>
                <Input
                  id="profile-alert-price"
                  type="number"
                  placeholder="e.g. 15000"
                  value={alertMaxPrice}
                  onChange={(e) => setAlertMaxPrice(e.target.value)}
                  min={0}
                  data-ocid="profile.alerts.price.input"
                />
              </div>
              <Button
                onClick={handleAddAlert}
                className="w-full sm:w-auto"
                data-ocid="profile.alerts.save.button"
              >
                <Bell className="w-4 h-4 mr-2" /> Save Alert
              </Button>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              Your Alerts
              {alerts.length > 0 && (
                <Badge variant="secondary">{alerts.length}</Badge>
              )}
            </h3>
            {alerts.length === 0 ? (
              <div
                className="bg-card border border-border rounded-xl p-10 text-center"
                data-ocid="profile.alerts.empty_state"
              >
                <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No alerts yet. Create one above!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={alert.id}
                    className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    data-ocid={`profile.alerts.item.${idx + 1}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{alert.location}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {propertyTypeLabels[alert.propertyType] ??
                              alert.propertyType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Max ₹{alert.maxPrice.toLocaleString("en-IN")}/mo
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.createdAt).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleDeleteAlert(alert.id)}
                      data-ocid={`profile.alerts.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" /> App Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-primary" />
                    ) : (
                      <Sun className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">
                      {isDark ? "Dark theme enabled" : "Light theme enabled"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDark}
                  onCheckedChange={toggleDark}
                  aria-label="Toggle dark mode"
                  data-ocid="profile.settings.dark_mode.switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      {notifEnabled
                        ? "Notifications enabled"
                        : "Notifications disabled"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifEnabled}
                  onCheckedChange={toggleNotif}
                  aria-label="Toggle notifications"
                  data-ocid="profile.settings.notifications.switch"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm">🌐</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Language</p>
                    <p className="text-xs text-muted-foreground">English</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              </div>
              <Separator />
              <div className="pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      data-ocid="profile.settings.logout.button"
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="profile.settings.logout.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sign out?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will be signed out of your account. You can sign
                        back in anytime.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="profile.settings.logout.cancel_button">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLogout}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-ocid="profile.settings.logout.confirm_button"
                      >
                        Sign Out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
