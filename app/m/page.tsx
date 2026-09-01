"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Truck, FileText, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export default function MobileHomePage() {
  const { t, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const res = await fetch("/api/credit-data");
      const json = await res.json();
      if (cancelled) return;
      setRows(json.data || []);

      const { data: perms } = await supabase
        .from("van_permissions")
        .select("*");
      if (cancelled) return;

      const map: Record<string, boolean> = {};
      (perms || []).forEach((p: any) => {
        map[p.van_code] = !!p.is_unblocked;
      });
      setPermissions(map);

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const vans = new Set<string>();
    let totalAmount = 0;

    rows.forEach((r) => {
      if (r.van_code) vans.add(r.van_code);
      const amt = parseFloat(r.credit_invoice_amount);
      if (!isNaN(amt)) totalAmount += amt;
    });

    const vanList = Array.from(vans);
    const unblockedCount = vanList.filter((v) => permissions[v]).length;
    const blockedCount = vanList.length - unblockedCount;

    return {
      invoiceCount: rows.length,
      totalAmount,
      vanCount: vanList.length,
      blockedCount,
      unblockedCount,
    };
  }, [rows, permissions]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<FileText size={18} />}
          label={t("totalInvoices")}
          value={loading ? "—" : stats.invoiceCount.toLocaleString()}
        />
        <StatCard
          icon={<Truck size={18} />}
          label={t("vansCount")}
          value={loading ? "—" : stats.vanCount.toLocaleString()}
        />
        <StatCard
          icon={<ShieldOff size={18} />}
          label={t("blocked")}
          value={loading ? "—" : stats.blockedCount.toLocaleString()}
          tone="red"
        />
        <StatCard
          icon={<ShieldCheck size={18} />}
          label={t("unblocked")}
          value={loading ? "—" : stats.unblockedCount.toLocaleString()}
          tone="green"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <p className="text-xs text-slate-500 mb-1">{t("totalAmount")}</p>
        <p className="text-2xl font-bold" style={{ color: "#071d5c" }}>
          {loading
            ? "—"
            : stats.totalAmount.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
        </p>
      </div>

      <Link
        href="/m/van"
        className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: "#071d5c" }}
          >
            <Truck size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm">{t("van")}</p>
            <p className="text-xs text-slate-500">{t("viewAll")}</p>
          </div>
        </div>
        <Chevron size={18} className="text-slate-400" />
      </Link>

      <Link
        href="/m/exceptions"
        className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: "#0b2a7a" }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm">{t("exceptions")}</p>
            <p className="text-xs text-slate-500">{t("viewAll")}</p>
          </div>
        </div>
        <Chevron size={18} className="text-slate-400" />
      </Link>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "red" | "green";
}) {
  const color =
    tone === "red" ? "#dc2626" : tone === "green" ? "#16a34a" : "#071d5c";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
