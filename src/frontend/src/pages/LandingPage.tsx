import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  CreditCard,
  GraduationCap,
  Search,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import PropertyCard from "../components/PropertyCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useApprovedProperties } from "../hooks/useQueries";

const STATS = [
  { label: "Properties Listed", value: "500+" },
  { label: "Happy Students", value: "10,000+" },
  { label: "Partner Colleges", value: "200+" },
  { label: "Cities Covered", value: "50+" },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Verified Listings",
    desc: "Every property is reviewed and approved by our team before going live. No scams, no surprises.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "Pay safely through Stripe. Your money is protected until you check in.",
  },
  {
    icon: GraduationCap,
    title: "Student Friendly",
    desc: "Listings near top colleges. Flexible leases, affordable prices for students.",
  },
  {
    icon: Users,
    title: "Easy Booking",
    desc: "Book your stay in minutes. Direct communication with owners, no middlemen.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { login, identity } = useInternetIdentity();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: properties, isLoading } = useApprovedProperties();

  const featuredProperties = (properties ?? []).slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({
      to: "/search",
      search: searchQuery ? { city: searchQuery } : {},
    });
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-accent/20 to-background py-16 lg:py-24">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-accent text-accent-foreground border-0 font-medium">
                <Star className="w-3 h-3 mr-1" /> Trusted by 10,000+ students
              </Badge>
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-tight tracking-tight text-foreground mb-5">
                Find Your Perfect{" "}
                <span className="text-primary">Student Stay</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Browse verified PGs, flats, and shared rooms near top colleges.
                Safe, affordable, and just a booking away.
              </p>

              {/* Search Bar */}
              <form
                onSubmit={handleSearch}
                className="flex gap-2 mb-6 max-w-lg"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by city or college name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 bg-card border-input"
                    data-ocid="hero.search.input"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-11 px-6"
                  data-ocid="hero.search.button"
                >
                  Search
                </Button>
              </form>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => router.navigate({ to: "/search" })}
                  data-ocid="hero.browse.button"
                >
                  Browse Properties <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    identity
                      ? router.navigate({ to: "/owner/listings/new" })
                      : login()
                  }
                  data-ocid="hero.list.button"
                >
                  List Your Property
                </Button>
              </div>
            </motion.div>

            {/* Right - Hero illustration */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="hidden lg:block"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-modal border border-border">
                <img
                  src="/assets/generated/hero-room-illustration.dim_600x480.png"
                  alt="Student room illustration"
                  className="w-full h-auto object-cover"
                />
                {/* Floating card */}
                <div className="absolute bottom-4 left-4 bg-card border border-border rounded-xl p-3 shadow-modal flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">
                      500+ Verified Properties
                    </p>
                    <p className="text-xs text-muted-foreground">
                      across 50+ cities
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Band */}
      <section className="bg-primary py-10">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-3xl font-display font-bold text-primary-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-primary-foreground/70 mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-20" data-ocid="features.section">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-foreground mb-4">
              Why Students Choose Hidestay
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We make finding student accommodation easy, safe, and affordable.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="bg-card border border-border rounded-xl p-6 h-full shadow-xs hover:shadow-card transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-secondary/30" data-ocid="featured.section">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display font-bold text-3xl text-foreground mb-2">
                Featured Properties
              </h2>
              <p className="text-muted-foreground">
                Hand-picked stays near top colleges
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.navigate({ to: "/search" })}
              data-ocid="featured.view_all.button"
            >
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl h-72 animate-pulse"
                  data-ocid="featured.loading_state"
                />
              ))}
            </div>
          ) : featuredProperties.length === 0 ? (
            <div
              className="text-center py-16 bg-card border border-border rounded-xl"
              data-ocid="featured.empty_state"
            >
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No approved properties yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((p, i) => (
                <PropertyCard
                  key={p.id.toString()}
                  property={p}
                  featured={i < 2}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Band */}
      <section className="py-16 lg:py-20">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-2xl p-10 lg:p-14 text-center">
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-primary-foreground mb-4">
              Ready to List Your Property?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Join 200+ property owners and reach thousands of students looking
              for accommodation.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() =>
                identity
                  ? router.navigate({ to: "/owner/listings/new" })
                  : login()
              }
              className="text-foreground"
              data-ocid="cta.list_property.button"
            >
              Get Started as an Owner <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
