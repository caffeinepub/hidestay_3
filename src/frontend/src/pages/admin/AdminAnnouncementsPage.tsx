import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2, Megaphone, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import RouteGuard from "../../components/RouteGuard";
import {
  useCreateAnnouncement,
  useDeactivateAnnouncement,
  useGetActiveAnnouncements,
} from "../../hooks/useQueries";

export default function AdminAnnouncementsPage() {
  return (
    <RouteGuard requiredRole="admin">
      <AdminAnnouncementsInner />
    </RouteGuard>
  );
}

function AdminAnnouncementsInner() {
  const { data: announcements, isLoading } = useGetActiveAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const deactivateAnnouncement = useDeactivateAnnouncement();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    let expiresAtBigInt: bigint | null = null;
    if (expiresAt) {
      const ms = new Date(expiresAt).getTime();
      if (Number.isNaN(ms)) {
        toast.error("Invalid expiry date");
        return;
      }
      expiresAtBigInt = BigInt(ms) * 1_000_000n;
    }
    try {
      await createAnnouncement.mutateAsync({
        title: title.trim(),
        message: message.trim(),
        expiresAt: expiresAtBigInt,
      });
      toast.success("Announcement created!");
      setTitle("");
      setMessage("");
      setExpiresAt("");
    } catch {
      toast.error("Failed to create announcement");
    }
  }

  async function handleDeactivate(id: bigint) {
    try {
      await deactivateAnnouncement.mutateAsync(id);
      toast.success("Announcement deactivated");
    } catch {
      toast.error("Failed to deactivate announcement");
    }
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-1">Announcements</h1>
        <p className="text-muted-foreground">
          Send platform-wide announcements to all users
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="w-5 h-5 text-primary" />
            Create Announcement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="space-y-4"
            data-ocid="admin_announcements.form.panel"
          >
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                data-ocid="admin_announcements.title.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-message">Message</Label>
              <Textarea
                id="ann-message"
                placeholder="Write your announcement message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                data-ocid="admin_announcements.textarea"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-expires">
                Expires At{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="ann-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                data-ocid="admin_announcements.expires.input"
              />
            </div>
            <Button
              type="submit"
              disabled={createAnnouncement.isPending}
              data-ocid="admin_announcements.submit.button"
            >
              {createAnnouncement.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4 mr-2" />
                  Send Announcement
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Active Announcements
          {announcements && announcements.length > 0 && (
            <Badge variant="secondary">{announcements.length}</Badge>
          )}
        </h2>

        {isLoading ? (
          <div
            className="space-y-3"
            data-ocid="admin_announcements.loading_state"
          >
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div
            className="text-center py-16 bg-card border border-border rounded-xl"
            data-ocid="admin_announcements.empty_state"
          >
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="font-semibold">No active announcements</p>
            <p className="text-sm text-muted-foreground">
              Create one above to notify users
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann, i) => {
              const createdDate = new Date(
                Number(ann.createdAt / 1_000_000n),
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const expiryDate = ann.expiresAt
                ? new Date(
                    Number(ann.expiresAt / 1_000_000n),
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null;

              return (
                <div
                  key={ann.id.toString()}
                  className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start"
                  data-ocid={`admin_announcements.item.${i + 1}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base">{ann.title}</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeactivate(ann.id)}
                        disabled={deactivateAnnouncement.isPending}
                        data-ocid={`admin_announcements.delete_button.${i + 1}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ann.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Created: {createdDate}</span>
                      {expiryDate && <span>Expires: {expiryDate}</span>}
                      {ann.isActive && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
