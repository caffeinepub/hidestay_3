import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2 font-display font-bold text-lg text-primary mb-3"
            >
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              Hidestay
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Find verified PGs and flats near top colleges. Safe, affordable
              student housing.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">For Students</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/search"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link
                  to="/my-bookings"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Bookings
                </Link>
              </li>
              <li>
                <Link
                  to="/auth/setup"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">For Owners</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/owner/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/owner/listings"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Manage Listings
                </Link>
              </li>
              <li>
                <Link
                  to="/owner/listings/new"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  List a Property
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">
                  About Hidestay
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Contact Support
                </span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">
                  Privacy Policy
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {year} Hidestay. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤️ using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
