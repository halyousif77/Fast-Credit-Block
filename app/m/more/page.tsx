"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, PieChart, FileBarChart, Users2, ScrollText, Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function MobileMorePage() {
  const { t, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const items = [
    { href: "/m/summary", label: t("summary"), icon: PieChart, color: "#071d5c" },
    { href: "/m/reports", label: t("reports"), icon: FileBarChart, color: "#0b2a7a" },
    { href: "/m/users", label: t("users"), icon: Users2, color: "#071d5c" },
    { href: "/m/logs", label: t("logs"), icon: ScrollText, color: "#0b2a7a" },
    { href: "/m/notifications-admin", label: t("notifications"), icon: Bell, color: "#071d5c" },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: item.color }}
              >
                <Icon size={19} />
              </div>
              <p className="font-semibold text-sm">{item.label}</p>
            </div>
            <Chevron size={18} className="text-slate-400" />
          </Link>
        );
      })}
    </div>
  );
}
