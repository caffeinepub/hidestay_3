import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import RouteGuard from "../../components/RouteGuard";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useOwnerNotifications,
} from "../../hooks/useQueries";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OwnerNotificationsPage() {
  return (
    <RouteGuard requiredRole="owner">
      <OwnerNotificationsInner />
    </RouteGuard>
  );
}

function OwnerNotificationsInner() {
  const router = useRouter();
  const { data: notifications, isLoading } = useOwnerNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();
  const autoReadFired = useRef(false);

  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;

  // Auto mark all as read once on mount after data loads
  useEffect(() => {
    if (
      !isLoading &&
      notifications &&
      notifications.length > 0 &&
      !autoReadFired.current
    ) {
      autoReadFired.current = true;
      if (unreadCount > 0) {
        markAllRead.mutate();
      }
    }
  }, [isLoading, notifications, unreadCount, markAllRead]);

  async function handleMarkAll() {
    try {
      await markAllRead.mutateAsync();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark notifications as read.");
    }
  }

  function handleClickNotification(id: bigint, isRead: boolean) {
    if (!isRead) {
      markOneRead.mutate(id);
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.navigate({ to: "/owner/dashboard" })}
            data-ocid="owner_notifications.back.button"
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="font-display font-bold text-3xl">Notifications</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Stay updated on inquiries and bookings
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAll}
          disabled={unreadCount === 0 || markAllRead.isPending}
          data-ocid="owner_notifications.mark_all_read.button"
        >
          Mark all as read
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          className="space-y-3"
          data-ocid="owner_notifications.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (notifications ?? []).length === 0 && (
        <div
          className="text-center py-20"
          data-ocid="owner_notifications.empty_state"
        >
          <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            You'll be notified when students interact with your properties.
          </p>
        </div>
      )}

      {/* Notifications list */}
      {!isLoading && (notifications ?? []).length > 0 && (
        <div className="space-y-2">
          {(notifications ?? []).map((notif, idx) => (
            <button
              key={notif.id.toString()}
              type="button"
              className={`w-full text-left flex items-start gap-4 px-4 py-4 rounded-xl border transition-colors cursor-pointer ${
                !notif.isRead
                  ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  : "bg-card border-border hover:bg-muted/40"
              }`}
              onClick={() => handleClickNotification(notif.id, notif.isRead)}
              data-ocid={`owner_notifications.item.${idx + 1}`}
            >
              {/* Icon */}
              <div
                className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${
                  !notif.isRead
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-relaxed ${
                    !notif.isRead
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {notif.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(notif.timestamp)}
                </p>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
