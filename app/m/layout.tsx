"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Truck, AlertTriangle, Grid2x2, Settings as SettingsIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { storage } from "@/utils/storage";
import { RegionFilterProvider } from "@/lib/regionFilter";
import { supabase } from "@/lib/supabase";

const NAVY_FROM = "#071d5c";
const NAVY_TO = "#0b2a7a";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, dir } = useI18n();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInName, setLoggedInName] = useState("");

  useEffect(() => {
    const check = async () => {
      const user = await storage.getItem("currentUser");
      setIsLoggedIn(!!user);

      if (!user) {
        setLoggedInName("");
        return;
      }

      const { data } = await supabase
        .from("app_users")
        .select("full_name")
        .eq("username", user)
        .maybeSingle();

      setLoggedInName(data?.full_name || user);
    };
    check();
    window.addEventListener("user-changed", check);
    return () => window.removeEventListener("user-changed", check);
  }, [pathname]);

  const tabs = [
    { href: "/m", label: t("home"), icon: Home, match: (p: string) => p === "/m" },
    { href: "/m/van", label: t("vanSummary"), icon: Truck, match: (p: string) => p.startsWith("/m/van") || p.startsWith("/m/summary") },
    { href: "/m/exceptions", label: t("exceptions"), icon: AlertTriangle, match: (p: string) => p.startsWith("/m/exceptions") },
    { href: "/m/more", label: t("more"), icon: Grid2x2, match: (p: string) => p.startsWith("/m/more") || ["/m/reports","/m/users","/m/logs","/m/notifications-admin"].some((x)=>p.startsWith(x)) },
    { href: "/m/settings", label: t("settings"), icon: SettingsIcon, match: (p: string) => p.startsWith("/m/settings") },
  ];

  return (
    <RegionFilterProvider>
    <div
      dir={dir}
      className="min-h-screen flex flex-col overflow-x-hidden w-full mobile-shell"
      style={{
        background: "#f4f7fc",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Top app bar */}
      <div
        className="sticky top-0 z-40 text-white"
        style={{
          background: `linear-gradient(to right, ${NAVY_FROM}, ${NAVY_TO})`,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="h-14 flex items-center justify-between px-4">
          <span className="font-bold text-[17px] tracking-tight">
            {t("creditDashboard")}
          </span>
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/15">
            {isLoggedIn ? `${t("loggedInAs")} ${loggedInName}` : t("notLoggedIn")}
          </span>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 px-4 pt-4 pb-28 max-w-md w-full mx-auto min-w-0">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur border-t border-slate-200 mobile-bottom-nav"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-md mx-auto grid grid-cols-5">
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] px-0.5 min-w-0 ${active ? "mobile-nav-active" : ""}`}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                <span className={`truncate max-w-full ${active ? "font-semibold" : ""}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </RegionFilterProvider>
  );
}
