import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  CreditCard,
  MessageSquare,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import type { Notification } from "../../backend";
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

type NotifType = "inquiry" | "booking" | "payment" | "general";

function detectType(message: string): NotifType {
  const lower = message.toLowerCase();
  if (lower.includes("inquiry") || lower.includes("contact")) return "inquiry";
  if (lower.includes("booking") || lower.includes("visit")) return "booking";
  if (lower.includes("payment") || lower.includes("confirmed"))
    return "payment";
  return "general";
}

const typeConfig: Record<
  NotifType,
  {
    icon: React.FC<{ className?: string }>;
    label: string;
    iconClass: string;
    bgClass: string;
  }
> = {
  inquiry: {
    icon: MessageSquare,
    label: "Inquiry",
    iconClass: "text-blue-600",
    bgClass: "bg-blue-50",
  },
  booking: {
    icon: Calendar,
    label: "Booking",
    iconClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  payment: {
    icon: CreditCard,
    label: "Payment",
    iconClass: "text-green-600",
    bgClass: "bg-green-50",
  },
  general: {
    icon: Bell,
    label: "General",
    iconClass: "text-muted-foreground",
    bgClass: "bg-muted",
  },
};

function NotifItem({
  notif,
  idx,
  onClick,
}: {
  notif: Notification;
  idx: number;
  onClick: (id: bigint, isRead: boolean) => void;
}) {
  const type = detectType(notif.message);
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <button
      key={notif.id.toString()}
      type="button"
      className={`w-full text-left flex items-start gap-4 px-4 py-4 rounded-xl border transition-colors cursor-pointer ${
        !notif.isRead
          ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
          : "bg-card border-border hover:bg-muted/40"
      }`}
      onClick={() => onClick(notif.id, notif.isRead)}
      data-ocid={`owner_notifications.item.${idx + 1}`}
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${
          !notif.isRead
            ? `${config.bgClass} ${config.iconClass}`
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
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
      {!notif.isRead && (
        <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
      )}
    </button>
  );
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

  const inquiryNotifs = useMemo(
    () =>
      (notifications ?? []).filter((n) => detectType(n.message) === "inquiry"),
    [notifications],
  );

  const bookingNotifs = useMemo(
    () =>
      (notifications ?? []).filter((n) => detectType(n.message) === "booking"),
    [notifications],
  );

  const allNotifs = notifications ?? [];

  function renderList(list: typeof allNotifs) {
    if (isLoading) {
      return (
        <div
          className="space-y-3"
          data-ocid="owner_notifications.loading_state"
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div
          className="text-center py-16"
          data-ocid="owner_notifications.empty_state"
        >
          <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">No notifications here</p>
          <p className="text-sm text-muted-foreground">
            You&apos;ll be notified when students interact with your properties.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {list.map((notif, idx) => (
          <NotifItem
            key={notif.id.toString()}
            notif={notif}
            idx={idx}
            onClick={handleClickNotification}
          />
        ))}
      </div>
    );
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

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="mb-6" data-ocid="owner_notifications.filter.tab">
          <TabsTrigger value="all">
            All
            {allNotifs.length > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {allNotifs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="inquiries">
            Inquiries
            {inquiryNotifs.length > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {inquiryNotifs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bookings">
            Bookings
            {bookingNotifs.length > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {bookingNotifs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderList(allNotifs)}</TabsContent>
        <TabsContent value="inquiries">{renderList(inquiryNotifs)}</TabsContent>
        <TabsContent value="bookings">{renderList(bookingNotifs)}</TabsContent>
      </Tabs>
    </div>
  );
}
