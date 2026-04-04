import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, Search, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const tabs = [
  { label: "Home", icon: Home, to: "/" },
  { label: "Search", icon: Search, to: "/search" },
  { label: "Wishlist", icon: Heart, to: "/wishlist" },
  { label: "Profile", icon: User, to: "/student/profile" },
] as const;

export default function BottomNav() {
  const { currentRole } = useAuth();
  const { location } = useRouterState();

  if (currentRole !== "student") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-lg"
      data-ocid="bottom_nav.panel"
    >
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const isActive =
            tab.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              data-ocid={`bottom_nav.${tab.label.toLowerCase()}.link`}
            >
              <tab.icon
                className={`w-5 h-5 transition-all ${
                  isActive ? "stroke-[2.5px] scale-110" : ""
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
