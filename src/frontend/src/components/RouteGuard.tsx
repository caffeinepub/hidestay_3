import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: "owner" | "admin" | "student" | "authenticated";
}

export default function RouteGuard({
  children,
  requiredRole,
}: RouteGuardProps) {
  const { session, adminSession, currentRole } = useAuth();

  const isAuthenticated = !!session || !!adminSession;

  // Show loading only briefly on first mount (no async here)
  if (!isAuthenticated) {
    if (requiredRole) {
      return <Navigate to="/auth/role" />;
    }
    return <>{children}</>;
  }

  if (requiredRole === "admin" && currentRole !== "admin") {
    return <Navigate to="/" />;
  }

  if (requiredRole === "owner" && currentRole !== "owner") {
    return <Navigate to="/" />;
  }

  if (requiredRole === "student" && currentRole !== "student") {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

// Loading spinner helper
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
