import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Variant_admin_owner_student } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useIsAdmin } from "../hooks/useQueries";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: "owner" | "admin" | "student" | "authenticated";
}

export default function RouteGuard({
  children,
  requiredRole,
}: RouteGuardProps) {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();

  if (isInitializing || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return <Navigate to="/" />;
  }

  if (!profile) {
    return <Navigate to="/auth/setup" />;
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (
    requiredRole === "owner" &&
    profile.role !== Variant_admin_owner_student.owner
  ) {
    return <Navigate to="/" />;
  }

  if (
    requiredRole === "student" &&
    profile.role !== Variant_admin_owner_student.student
  ) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
