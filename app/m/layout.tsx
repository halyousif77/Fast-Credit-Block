"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Truck, AlertTriangle, Grid2x2, Settings as SettingsIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { storage } from "@/utils/storage";
import { RegionFilterProvider, useRegionFilter } from "@/lib/regionFilter";

const NAVY_FROM = "#071d5c";
const NAVY_TO = "#0b2a7a";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RegionFilterProvider>
      <MobileShell>{children}</MobileShell>
    </RegionFilterProvider>
  );
}

function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, dir } = useI18n();
  const { loading } = useRegionFilter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  // Never leave the mobile UI locked forever if an API/network request hangs.
  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
      return;
    }

    setShowLoading(true);
    const failsafe = window.setTimeout(() => setShowLoading(false), 12000);
    return () => window.clearTimeout(failsafe);
  }, [loading]);

  useEffect(() => {
    const check = async () => {
      const user = await storage.getItem("currentUser");
      setIsLoggedIn(!!user);
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
    <div
      dir={dir}
      className="min-h-screen flex flex-col overflow-x-hidden w-full"
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
            Credit Dashboard
          </span>
          <span className="text-[11px] px-2 py-1 rounded-full bg-white/15">
            {isLoggedIn ? t("loggedInAs") : t("notLoggedIn")}
          </span>
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 px-4 pt-4 pb-28 max-w-md w-full mx-auto min-w-0">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200"
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
                className="flex flex-col items-center justify-center gap-1 py-2 text-[10px] px-0.5 min-w-0"
                style={{ color: active ? NAVY_TO : "#94a3b8" }}
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
      {showLoading && (
        <div className="fixed inset-0 z-[100] bg-[#f4f7fc]/95 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-xs rounded-3xl bg-white shadow-xl border border-slate-100 p-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl flex items-center justify-center bg-[#071d5c]">
              <div className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            </div>
            <p className="font-bold text-[#071d5c]">Loading data</p>
            <p className="mt-1 text-xs text-slate-500">Please wait while the latest data is loaded</p>
            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 rounded-full bg-[#071d5c] animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
