import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// ---- Types ----
export interface UserSession {
  phone: string;
  role: "student" | "owner";
  sessionToken: string;
}

export interface AdminSession {
  email: string;
  name: string;
  token: string;
}

interface StoredAdmin {
  email: string;
  passwordHash: string;
  name: string;
}

interface AuthContextType {
  // Student/Owner
  session: UserSession | null;
  generateOTP: (phone: string) => string;
  verifyOTP: (phone: string, otp: string) => boolean;
  setUserSession: (phone: string, role: "student" | "owner") => void;
  logout: () => void;

  // Admin
  adminSession: AdminSession | null;
  adminLogin: (email: string, password: string) => boolean;
  adminRegister: (
    email: string,
    password: string,
    name: string,
  ) => { ok: boolean; error?: string };
  adminForgotPassword: (email: string) => {
    ok: boolean;
    code?: string;
    error?: string;
  };
  adminResetPassword: (
    email: string,
    resetToken: string,
    newPassword: string,
  ) => { ok: boolean; error?: string };
  adminLogout: () => void;

  // Derived
  isAuthenticated: boolean;
  currentRole: "student" | "owner" | "admin" | null;
}

const STORAGE_KEYS = {
  SESSION: "hidestay_session",
  ADMIN_SESSION: "hidestay_admin_session",
  ADMINS: "hidestay_admins",
} as const;

const AuthContext = createContext<AuthContextType | null>(null);

function getAdmins(): StoredAdmin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMINS);
    return raw ? (JSON.parse(raw) as StoredAdmin[]) : [];
  } catch {
    return [];
  }
}

function saveAdmins(admins: StoredAdmin[]) {
  localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
}

function hashPassword(password: string): string {
  return btoa(password);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  });

  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      return raw ? (JSON.parse(raw) as AdminSession) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [session]);

  useEffect(() => {
    if (adminSession) {
      localStorage.setItem(
        STORAGE_KEYS.ADMIN_SESSION,
        JSON.stringify(adminSession),
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    }
  }, [adminSession]);

  // --- OTP ---
  function generateOTP(phone: string): string {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    localStorage.setItem(
      `hidestay_otp_${phone}`,
      JSON.stringify({ otp, timestamp: Date.now() }),
    );
    return otp;
  }

  function verifyOTP(phone: string, otp: string): boolean {
    const raw = localStorage.getItem(`hidestay_otp_${phone}`);
    if (!raw) return false;
    try {
      const { otp: stored, timestamp } = JSON.parse(raw) as {
        otp: string;
        timestamp: number;
      };
      const expired = Date.now() - timestamp > 10 * 60 * 1000; // 10 min
      if (expired) {
        localStorage.removeItem(`hidestay_otp_${phone}`);
        return false;
      }
      if (stored === otp) {
        localStorage.removeItem(`hidestay_otp_${phone}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function setUserSession(phone: string, role: "student" | "owner") {
    const newSession: UserSession = {
      phone,
      role,
      sessionToken: btoa(`${phone}:${role}:${Date.now()}`),
    };
    setSession(newSession);
  }

  function logout() {
    setSession(null);
  }

  // --- Admin ---
  function adminLogin(email: string, password: string): boolean {
    const admins = getAdmins();
    const found = admins.find(
      (a) =>
        a.email.toLowerCase() === email.toLowerCase() &&
        a.passwordHash === hashPassword(password),
    );
    if (!found) return false;
    setAdminSession({
      email: found.email,
      name: found.name,
      token: btoa(`${found.email}:${Date.now()}`),
    });
    return true;
  }

  function adminRegister(
    email: string,
    password: string,
    name: string,
  ): { ok: boolean; error?: string } {
    const admins = getAdmins();
    // Only allowed if no admins exist OR caller has an admin session
    if (admins.length > 0 && !adminSession) {
      return {
        ok: false,
        error: "Only existing admins can create new admin accounts.",
      };
    }
    if (admins.find((a) => a.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "An admin with this email already exists." };
    }
    admins.push({ email, passwordHash: hashPassword(password), name });
    saveAdmins(admins);
    return { ok: true };
  }

  function adminForgotPassword(email: string): {
    ok: boolean;
    code?: string;
    error?: string;
  } {
    const admins = getAdmins();
    const found = admins.find(
      (a) => a.email.toLowerCase() === email.toLowerCase(),
    );
    if (!found)
      return { ok: false, error: "No admin account found with this email." };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    localStorage.setItem(
      `hidestay_reset_${email}`,
      JSON.stringify({ code, timestamp: Date.now() }),
    );
    return { ok: true, code };
  }

  function adminResetPassword(
    email: string,
    resetToken: string,
    newPassword: string,
  ): { ok: boolean; error?: string } {
    const raw = localStorage.getItem(`hidestay_reset_${email}`);
    if (!raw) return { ok: false, error: "Invalid or expired reset code." };
    try {
      const { code, timestamp } = JSON.parse(raw) as {
        code: string;
        timestamp: number;
      };
      if (Date.now() - timestamp > 15 * 60 * 1000) {
        localStorage.removeItem(`hidestay_reset_${email}`);
        return {
          ok: false,
          error: "Reset code has expired. Please request a new one.",
        };
      }
      if (code !== resetToken)
        return { ok: false, error: "Incorrect reset code." };
      const admins = getAdmins();
      const idx = admins.findIndex(
        (a) => a.email.toLowerCase() === email.toLowerCase(),
      );
      if (idx === -1) return { ok: false, error: "Admin account not found." };
      admins[idx].passwordHash = hashPassword(newPassword);
      saveAdmins(admins);
      localStorage.removeItem(`hidestay_reset_${email}`);
      return { ok: true };
    } catch {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  }

  function adminLogout() {
    setAdminSession(null);
  }

  const isAuthenticated = !!session || !!adminSession;
  const currentRole: "student" | "owner" | "admin" | null = adminSession
    ? "admin"
    : session
      ? session.role
      : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        generateOTP,
        verifyOTP,
        setUserSession,
        logout,
        adminSession,
        adminLogin,
        adminRegister,
        adminForgotPassword,
        adminResetPassword,
        adminLogout,
        isAuthenticated,
        currentRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
