"use client";
import { apiFetch as fetch } from "@/lib/apiCache";


import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, ShieldCheck, ShieldOff, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { fetchCreditRows } from "@/lib/creditData";

export default function MobileVanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, dir } = useI18n();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const vanCode = decodeURIComponent(String(params.van || ""));

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [collectedInvoices, setCollectedInvoices] = useState<string[]>([]);
  const [creditRules, setCreditRules] = useState<any[]>([]);
  const [isUnblocked, setIsUnblocked] = useState(false);
  const [search, setSearch] = useState("");
  const [showExceptions, setShowExceptions] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const [data, exRes, colRes, rulesRes] = await Promise.all([
        fetchCreditRows(),
        fetch("/api/exceptions"),
        fetch("/api/collection-data"),
        supabase.from("credit_block_rules").select("*"),
      ]);
      if (cancelled) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exJson = await exRes.json();
      const valid = (Array.isArray(exJson) ? exJson : []).filter((item: any) => {
        if (item.permanent) return true;
        const till = new Date(item.till_date);
        till.setHours(0, 0, 0, 0);
        return till >= today;
      });
      const colJson = await colRes.json();

      const vanRows = data.filter((r) => r.vanCode === vanCode);

      setRows(vanRows);
      // Exceptions belong to the van directly; do not depend on the invoice
      // still existing in the credit file.
      setExceptions(
        valid.filter((e: any) =>
          String(e.van_code || "").trim().toUpperCase() === vanCode.trim().toUpperCase()
        )
      );
      setCollectedInvoices(colJson?.invoices || []);
      setCreditRules(rulesRes.data || []);

      const { data: perm } = await supabase
        .from("van_permissions")
        .select("is_unblocked")
        .eq("van_code", vanCode)
        .maybeSingle();

      if (cancelled) return;
      setIsUnblocked(!!perm?.is_unblocked);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [vanCode]);

  const normalize = (v: any) =>
    String(v || "").replace(/^ATS\s+/i, "").replace(/\s+/g, " ").trim().toUpperCase();

  const isExceptionInvoice = (invoice: any) =>
    exceptions.some(
      (e) => String(e.invoice || "").replace(/\s/g, "").toUpperCase() ===
        String(invoice || "").replace(/\s/g, "").toUpperCase()
    );

  const filtered = useMemo(() => {
    const result = rows.filter((r) => {
      const rule = creditRules.find((x) => normalize(x.payment_term) === normalize(r.paymentTerm));
      const invoiceKey = String(r.invoice || "").replace(/\s/g, "").toUpperCase();
      const collected = collectedInvoices.some(
        (i) => String(i || "").replace(/\s/g, "").toUpperCase() === invoiceKey
      );
      return (
        String(r.centralInvoice || "").trim().toUpperCase() === "NOT CENTRAL" &&
        !String(r.invoiceStatus || "").toLowerCase().includes("legal") &&
        !!rule &&
        r.creditDays >= (Number(rule.block_at_day) || 0) &&
        !isExceptionInvoice(r.invoice) &&
        !collected
      );
    });
    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
      (r) =>
        String(r.invoice || "").toLowerCase().includes(q) ||
        String(r.customerName || "").toLowerCase().includes(q) ||
        String(r.customerCode || "").toLowerCase().includes(q)
    );
  }, [rows, search, exceptions, collectedInvoices, creditRules]);

  return (
    <div className="space-y-3">
      <button
        onClick={() => router.push("/m/van")}
        className="flex items-center gap-1.5 text-sm text-slate-500 mb-1"
      >
        <Back size={16} />
        {t("back")}
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t("van")}</p>
          <p className="font-bold text-lg" style={{ color: "#071d5c" }}>
            {vanCode}
          </p>
        </div>

        {isUnblocked ? (
          <span className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1.5 rounded-full text-xs font-medium">
            <ShieldCheck size={14} /> {t("unblocked")}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-700 bg-red-50 px-3 py-1.5 rounded-full text-xs font-medium">
            <ShieldOff size={14} /> {t("blocked")}
          </span>
        )}
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 text-slate-400"
          style={{ insetInlineStart: 12 }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 ps-9 pe-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {loading && (
        <p className="text-center text-sm text-slate-400 py-10">
          {t("loading")}
        </p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">
          {t("noData")}
        </p>
      )}

      {exceptions.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExceptions((v) => !v)}
            className="w-full p-3.5 flex items-center justify-between gap-3 text-start"
          >
            <div>
              <p className="text-sm font-bold text-orange-800">Exceptions</p>
              <p className="text-xs text-orange-700 mt-0.5">
                {exceptions.length} exception{exceptions.length === 1 ? "" : "s"} for this van
              </p>
            </div>
            {showExceptions ? (
              <ChevronUp size={18} className="text-orange-700 shrink-0" />
            ) : (
              <ChevronDown size={18} className="text-orange-700 shrink-0" />
            )}
          </button>

          {showExceptions && (
            <div className="px-3.5 pb-3.5 space-y-2">
              {exceptions.map((e, i) => (
                <div
                  key={`${e.invoice}-${i}`}
                  className="bg-white rounded-xl border border-orange-100 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{e.invoice || "—"}</p>
                    <span className="text-[11px] font-medium text-orange-700 text-end">
                      {e.permanent ? (
                        "Permanent"
                      ) : (() => {
                        const till = new Date(e.till_date);
                        till.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const daysLeft = Math.max(
                          0,
                          Math.round((till.getTime() - today.getTime()) / 86400000)
                        );
                        return (
                          <>
                            <span className="block">
                              {daysLeft === 0
                                ? "Expires today"
                                : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                            </span>
                            <span className="block text-[10px] text-orange-600 mt-0.5">
                              {e.till_date || ""}
                            </span>
                          </>
                        );
                      })()}
                    </span>
                  </div>
                  {e.customer_name && (
                    <p className="text-xs text-slate-600 mt-1">{e.customer_code ? `${e.customer_code} · ` : ""}{e.customer_name}</p>
                  )}
                  {e.reason && (
                    <p className="text-xs text-slate-500 mt-1">{e.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((r, i) => (
          <div
            key={`${r.invoice}-${i}`}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm">{r.invoice}</p>
              <p className="text-sm font-bold" style={{ color: "#071d5c" }}>
                {r.amount.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {r.customerName} · {r.customerCode}
            </p>
            {r.trxDate && (
              <p className="text-[11px] text-slate-400 mt-1">
                {String(r.trxDate).split("T")[0]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
