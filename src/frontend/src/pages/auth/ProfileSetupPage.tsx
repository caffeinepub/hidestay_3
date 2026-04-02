import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@tanstack/react-router";
import { Home, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Variant_admin_owner_student } from "../../backend";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useRequestApproval,
  useSaveProfile,
} from "../../hooks/useQueries";

export default function ProfileSetupPage() {
  const router = useRouter();
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: existingProfile } = useCallerProfile();
  const saveProfile = useSaveProfile();
  const requestApproval = useRequestApproval();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userRole, setUserRole] = useState<Variant_admin_owner_student>(
    Variant_admin_owner_student.student,
  );

  useEffect(() => {
    if (existingProfile) {
      setName(existingProfile.name);
      setEmail(existingProfile.email);
      setPhone(existingProfile.phone);
      setUserRole(existingProfile.role);
    }
  }, [existingProfile]);

  if (!identity) {
    return (
      <div className="container max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-card border border-border rounded-2xl p-10 shadow-card">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">
            Sign In to Hidestay
          </h1>
          <p className="text-muted-foreground mb-6">
            Create your profile to start booking or listing properties.
          </p>
          <Button
            className="w-full"
            onClick={login}
            disabled={loginStatus === "logging-in"}
            data-ocid="auth.login.button"
          >
            {loginStatus === "logging-in" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
              </>
            ) : (
              "Sign In with Internet Identity"
            )}
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProfile.mutateAsync({
        name,
        email,
        phone,
        role: userRole,
      });

      if (userRole === Variant_admin_owner_student.owner) {
        await requestApproval.mutateAsync();
        toast.success("Profile saved! Your owner account is pending approval.");
        router.navigate({ to: "/owner/dashboard" });
      } else {
        toast.success("Profile saved successfully!");
        router.navigate({ to: "/search" });
      }
    } catch (_err) {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const isPending = saveProfile.isPending || requestApproval.isPending;

  return (
    <div className="container max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Home className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display font-bold text-2xl mb-1">
          {existingProfile ? "Update Your Profile" : "Complete Your Profile"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {existingProfile
            ? "Update your account information"
            : "Set up your account to get started"}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
        <form
          onSubmit={handleSave}
          className="space-y-5"
          data-ocid="profile.form"
        >
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
              data-ocid="profile.name.input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email">Email Address</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              data-ocid="profile.email.input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-phone">Phone Number</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              data-ocid="profile.phone.input"
            />
          </div>

          <div className="space-y-2">
            <Label>I am a...</Label>
            <Select
              value={userRole}
              onValueChange={(v) =>
                setUserRole(v as Variant_admin_owner_student)
              }
            >
              <SelectTrigger data-ocid="profile.role.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Variant_admin_owner_student.student}>
                  Student — looking for accommodation
                </SelectItem>
                <SelectItem value={Variant_admin_owner_student.owner}>
                  Property Owner — want to list my property
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userRole === Variant_admin_owner_student.owner && (
            <div className="bg-accent/40 rounded-lg p-3 text-sm text-muted-foreground">
              ℹ️ Your owner account will need admin approval before you can list
              properties.
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            data-ocid="profile.save.button"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : existingProfile ? (
              "Update Profile"
            ) : (
              "Save Profile"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
