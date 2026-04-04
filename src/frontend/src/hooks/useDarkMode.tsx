import { useEffect, useState } from "react";

const STORAGE_KEY = "hidestay_dark_mode";

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "true" : "false");
    } catch {}
  }, [isDark]);

  function toggleDark() {
    setIsDark((prev) => !prev);
  }

  return { isDark, toggleDark };
}
