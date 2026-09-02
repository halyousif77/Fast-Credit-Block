"use client";
import { apiFetch as fetch } from "@/lib/apiCache";


import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function MobileReportsPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(true);
  const [creditData, setCreditData] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (cancelled) return;
      setCreditData(json.creditData || []);
      setCollections(json.collections || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(() => {
    let creditTotal = 0;
    creditData.forEach((r) => {
      const amt = parseFloat(r.credit_invoice_amount);
      if (!isNaN(amt)) creditTotal += amt;
    });

    let collectionsTotal = 0;
    collections.forEach((c) => {
      const amt = parseFloat(c.amount ?? c.total_amount ?? 0);
      if (!isNaN(amt)) collectionsTotal += amt;
    });

    return { creditTotal, collectionsTotal, invoices: creditData.length, uploads: collections.length };
  }, [creditData, collections]);

  return (
    <div className="space-y-3">
      <button
        onClick={() => router.push("/m/more")}
        className="flex items-center gap-1.5 text-sm text-slate-500 mb-1"
      >
        <Back size={16} />
        {t("back")}
      </button>

      {loading ? (
        <p className="text-center text-sm text-slate-400 py-10">{t("loading")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-slate-500 mb-1">{t("totalInvoices")}</p>
            <p className="text-xl font-bold" style={{ color: "#071d5c" }}>
              {totals.invoices.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <p className="text-xs text-slate-500 mb-1">{t("totalAmount")}</p>
            <p className="text-xl font-bold" style={{ color: "#071d5c" }}>
              {totals.creditTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 col-span-2">
            <p className="text-xs text-slate-500 mb-1">{t("collections")}</p>
            <p className="text-xl font-bold text-green-700">
              {totals.collectionsTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totals.uploads} uploads
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
