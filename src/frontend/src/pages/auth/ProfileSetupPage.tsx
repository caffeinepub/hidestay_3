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
import { useRouter, useSearch } from "@tanstack/react-router";
import { Loader2, Upload, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_admin_owner_student } from "../../backend";
import { useAuth } from "../../hooks/useAuth";
import { useRequestApproval, useSaveProfile } from "../../hooks/useQueries";

type SearchParams = {
  phone?: string;
  role?: string;
};

interface ExtendedStudentProfile {
  collegeName: string;
  preferredLocation: string;
  budgetMin: string;
  budgetMax: string;
  gender: string;
}

interface ExtendedOwnerProfile {
  businessName: string;
  propertyLocation: string;
  idProofFileName: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const search = useSearch({ strict: false }) as SearchParams;
  const phone =
    search.phone ?? sessionStorage.getItem("hidestay_pending_phone") ?? "";
  const role = (search.role ??
    sessionStorage.getItem("hidestay_pending_role") ??
    "student") as "student" | "owner";

  const { setUserSession } = useAuth();
  const saveProfile = useSaveProfile();
  const requestApproval = useRequestApproval();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Student-specific
  const [studentExt, setStudentExt] = useState<ExtendedStudentProfile>({
    collegeName: "",
    preferredLocation: "",
    budgetMin: "",
    budgetMax: "",
    gender: "",
  });

  // Owner-specific
  const [ownerExt, setOwnerExt] = useState<ExtendedOwnerProfile>({
    businessName: "",
    propertyLocation: "",
    idProofFileName: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const backendRole =
      role === "owner"
        ? Variant_admin_owner_student.owner
        : Variant_admin_owner_student.student;

    try {
      // Save core profile to backend
      await saveProfile.mutateAsync({ name, email, phone, role: backendRole });

      // Save extended profile to localStorage
      if (role === "student") {
        localStorage.setItem(
          `hidestay_profile_ext_${phone}`,
          JSON.stringify(studentExt),
        );
      } else {
        localStorage.setItem(
          `hidestay_profile_ext_${phone}`,
          JSON.stringify(ownerExt),
        );
        await requestApproval.mutateAsync();
      }

      // Create session
      setUserSession(phone, role);

      if (role === "owner") {
        toast.success(
          "Profile created! Awaiting admin approval to list properties.",
        );
        router.navigate({ to: "/owner/dashboard" });
      } else {
        toast.success("Welcome to Hidestay! Start exploring properties.");
        router.navigate({ to: "/search" });
      }
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  }

  const isPending = saveProfile.isPending || requestApproval.isPending;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-full bg-primary/10 items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl text-foreground mb-1">
            Complete your profile
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "owner"
              ? "Tell us about you and your property"
              : "Tell us about yourself"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            data-ocid="profile.form"
          >
            {/* Common fields */}
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
              <Label>Mobile Number</Label>
              <Input
                value={phone ? `+91 ${phone}` : ""}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>

            {/* Student-specific fields */}
            {role === "student" && (
              <>
                <div className="pt-1 pb-0.5">
                  <div className="h-px bg-border" />
                  <p className="text-xs font-medium text-muted-foreground mt-3 mb-3 uppercase tracking-wide">
                    Student Details
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college-name">College Name</Label>
                  <Input
                    id="college-name"
                    value={studentExt.collegeName}
                    onChange={(e) =>
                      setStudentExt((p) => ({
                        ...p,
                        collegeName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Delhi University, IIT Bombay"
                    required
                    data-ocid="profile.college.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred-location">Preferred Location</Label>
                  <Input
                    id="preferred-location"
                    value={studentExt.preferredLocation}
                    onChange={(e) =>
                      setStudentExt((p) => ({
                        ...p,
                        preferredLocation: e.target.value,
                      }))
                    }
                    placeholder="e.g. Koramangala, Bangalore"
                    required
                    data-ocid="profile.location.input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="budget-min">Budget Min (₹/mo)</Label>
                    <Input
                      id="budget-min"
                      type="number"
                      min={0}
                      value={studentExt.budgetMin}
                      onChange={(e) =>
                        setStudentExt((p) => ({
                          ...p,
                          budgetMin: e.target.value,
                        }))
                      }
                      placeholder="3000"
                      data-ocid="profile.budget.min.input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget-max">Budget Max (₹/mo)</Label>
                    <Input
                      id="budget-max"
                      type="number"
                      min={0}
                      value={studentExt.budgetMax}
                      onChange={(e) =>
                        setStudentExt((p) => ({
                          ...p,
                          budgetMax: e.target.value,
                        }))
                      }
                      placeholder="10000"
                      data-ocid="profile.budget.max.input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={studentExt.gender}
                    onValueChange={(v) =>
                      setStudentExt((p) => ({ ...p, gender: v }))
                    }
                  >
                    <SelectTrigger data-ocid="profile.gender.select">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Owner-specific fields */}
            {role === "owner" && (
              <>
                <div className="pt-1 pb-0.5">
                  <div className="h-px bg-border" />
                  <p className="text-xs font-medium text-muted-foreground mt-3 mb-3 uppercase tracking-wide">
                    Owner Details
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-name">Business / Full Name</Label>
                  <Input
                    id="business-name"
                    value={ownerExt.businessName}
                    onChange={(e) =>
                      setOwnerExt((p) => ({
                        ...p,
                        businessName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Sharma PG Homes"
                    required
                    data-ocid="profile.business.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="property-location">Property Location</Label>
                  <Input
                    id="property-location"
                    value={ownerExt.propertyLocation}
                    onChange={(e) =>
                      setOwnerExt((p) => ({
                        ...p,
                        propertyLocation: e.target.value,
                      }))
                    }
                    placeholder="e.g. Sector 14, Gurgaon"
                    required
                    data-ocid="profile.property.location.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="id-proof">
                    ID Proof (Aadhaar / PAN — optional)
                  </Label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="id-proof"
                      className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-dashed border-input rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground"
                      data-ocid="profile.id.upload_button"
                    >
                      <Upload className="w-4 h-4" />
                      {ownerExt.idProofFileName || "Choose file"}
                    </label>
                    <input
                      id="id-proof"
                      type="file"
                      accept="image/*,.pdf"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          setOwnerExt((p) => ({
                            ...p,
                            idProofFileName: file.name,
                          }));
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Helps build trust with students (stored locally in demo)
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                  ℹ️ Your owner account will need admin approval before you can
                  list properties.
                </div>
              </>
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
              ) : (
                "Create Profile & Continue →"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
