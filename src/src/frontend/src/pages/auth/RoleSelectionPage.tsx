import { useRouter } from "@tanstack/react-router";
import { Building2, GraduationCap, Home, Shield } from "lucide-react";
import { motion } from "motion/react";

export default function RoleSelectionPage() {
  const router = useRouter();

  function choose(role: "student" | "owner") {
    sessionStorage.setItem("hidestay_pending_role", role);
    router.navigate({ to: "/auth/phone" });
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-xl">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Home className="w-3.5 h-3.5" />
            Welcome to Hidestay
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            How will you use Hidestay?
          </h1>
          <p className="text-muted-foreground">
            Choose your role to get started with the right experience
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            type="button"
            onClick={() => choose("student")}
            className="group relative flex flex-col items-start gap-4 p-6 bg-card border-2 border-border rounded-2xl hover:border-primary hover:shadow-card transition-all duration-200 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-ocid="role.student.button"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-1">
                I&apos;m a Student
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Find affordable PGs, flats, and rooms near your college.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-primary text-sm font-medium">
              Find a stay →
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => choose("owner")}
            className="group relative flex flex-col items-start gap-4 p-6 bg-card border-2 border-border rounded-2xl hover:border-primary hover:shadow-card transition-all duration-200 text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            data-ocid="role.owner.button"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-foreground mb-1">
                I&apos;m a Property Owner
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                List your PG, flat, or room and connect with students.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-primary text-sm font-medium">
              List a property →
            </div>
          </motion.button>
        </div>

        {/* Admin link */}
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            type="button"
            onClick={() => router.navigate({ to: "/admin/login" })}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="role.admin.link"
          >
            <Shield className="w-3 h-3" />
            Admin login
          </button>
        </motion.div>
      </div>
    </div>
  );
}
