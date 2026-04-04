import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  CreditCard,
  Home,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export interface StudentNotification {
  id: string;
  message: string;
  type:
    | "booking_confirmed"
    | "booking_rejected"
    | "booking_cancelled"
    | "price_alert"
    | "property_alert";
  timestamp: number;
  isRead: boolean;
}

export function getStudentNotifs(phone: string): StudentNotification[] {
  try {
    const raw = localStorage.getItem(`hidestay_student_notifs_${phone}`);
    return raw ? (JSON.parse(raw) as StudentNotification[]) : [];
  } catch {
    return [];
  }
}

export function saveStudentNotifs(
  phone: string,
  notifs: StudentNotification[],
) {
  localStorage.setItem(
    `hidestay_student_notifs_${phone}`,
    JSON.stringify(notifs),
  );
}

export function pushStudentNotif(
  phone: string,
  notif: Omit<StudentNotification, "id" | "timestamp" | "isRead">,
) {
  const notifs = getStudentNotifs(phone);
  notifs.unshift({
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    isRead: false,
  });
  saveStudentNotifs(phone, notifs.slice(0, 100));
}

const typeConfig: Record<
  StudentNotification["type"],
  { icon: React.FC<{ className?: string }>; label: string; color: string }
> = {
  booking_confirmed: {
    icon: Calendar,
    label: "Booking Confirmed",
    color: "text-green-600 bg-green-50",
  },
  booking_rejected: {
    icon: AlertCircle,
    label: "Booking Rejected",
    color: "text-red-600 bg-red-50",
  },
  booking_cancelled: {
    icon: AlertCircle,
    label: "Booking Cancelled",
    color: "text-orange-600 bg-orange-50",
  },
  price_alert: {
    icon: CreditCard,
    label: "Price Drop",
    color: "text-blue-600 bg-blue-50",
  },
  property_alert: {
    icon: Home,
    label: "New Property",
    color: "text-primary bg-primary/10",
  },
};

export default function StudentNotificationsPage() {
  const { session } = useAuth();
  const router = useRouter();
  const phone = session?.phone ?? "";

  const [notifs, setNotifs] = useState<StudentNotification[]>(() =>
    getStudentNotifs(phone),
  );

  // Refresh on mount
  useEffect(() => {
    if (phone) {
      setNotifs(getStudentNotifs(phone));
    }
  }, [phone]);

  function markAllRead() {
    const updated = notifs.map((n) => ({ ...n, isRead: true }));
    setNotifs(updated);
    saveStudentNotifs(phone, updated);
  }

  function markOneRead(id: string) {
    const updated = notifs.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    setNotifs(updated);
    saveStudentNotifs(phone, updated);
  }

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.history.back()}
            data-ocid="student_notifications.back.button"
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="font-display font-bold text-3xl flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  {unreadCount}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Your booking updates and property alerts
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          data-ocid="student_notifications.mark_all_read.button"
        >
          Mark all as read
        </Button>
      </div>

      {/* Empty state */}
      {notifs.length === 0 && (
        <div
          className="text-center py-20"
          data-ocid="student_notifications.empty_state"
        >
          <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-semibold text-lg mb-1">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            You&apos;ll be notified about booking updates and new properties
            matching your alerts.
          </p>
        </div>
      )}

      {/* Notifications list */}
      {notifs.length > 0 && (
        <div className="space-y-2">
          {notifs.map((notif, idx) => {
            const config = typeConfig[notif.type];
            const Icon = config.icon;
            const dateStr = new Date(notif.timestamp).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <button
                key={notif.id}
                type="button"
                className={`w-full text-left flex items-start gap-4 px-4 py-4 rounded-xl border transition-colors cursor-pointer ${
                  !notif.isRead
                    ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                    : "bg-card border-border hover:bg-muted/40"
                }`}
                onClick={() => markOneRead(notif.id)}
                data-ocid={`student_notifications.item.${idx + 1}`}
              >
                {/* Icon */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5 ${config.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {config.label}
                    </span>
                  </div>
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
                    {dateStr}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
