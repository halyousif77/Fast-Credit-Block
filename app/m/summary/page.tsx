"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function MobileSummaryPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/credit-data");
      const json = await res.json();
      if (cancelled) return;
      setRows(json.data || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byRegion = useMemo(() => {
    const map: Record<string, { region: string; count: number; amount: number }> = {};
    rows.forEach((r) => {
      const key = r.region || "—";
      if (!map[key]) map[key] = { region: key, count: 0, amount: 0 };
      map[key].count += 1;
      const amt = parseFloat(r.credit_invoice_amount);
      if (!isNaN(amt)) map[key].amount += amt;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [rows]);

  return (
    <div className="space-y-3">
      <button
        onClick={() => router.push("/m/more")}
        className="flex items-center gap-1.5 text-sm text-slate-500 mb-1"
      >
        <Back size={16} />
        {t("back")}
      </button>

      {loading && (
        <p className="text-center text-sm text-slate-400 py-10">{t("loading")}</p>
      )}

      {!loading && byRegion.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">{t("noData")}</p>
      )}

      <div className="space-y-2">
        {byRegion.map((r) => (
          <div
            key={r.region}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm">{r.region}</p>
              <p className="text-sm font-bold" style={{ color: "#071d5c" }}>
                {r.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              {r.count} {t("invoice")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
