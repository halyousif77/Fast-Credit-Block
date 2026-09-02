"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { storage } from "@/utils/storage";

export type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem("appTheme");
      if (saved === "dark" || saved === "light") setThemeState(saved);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    storage.setItem("appTheme", next);
    if (typeof document !== "undefined") document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("theme-changed"));
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
