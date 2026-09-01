"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, ShieldCheck, ShieldOff, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { storage } from "@/utils/storage";

export default function MobileVanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, dir } = useI18n();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const vanCode = decodeURIComponent(String(params.van || ""));

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [collectedInvoices, setCollectedInvoices] = useState<string[]>([]);
  const [creditRules, setCreditRules] = useState<any[]>([]);
  const [isUnblocked, setIsUnblocked] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showExceptions, setShowExceptions] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const currentUser = await storage.getItem("currentUser");
      if (cancelled) return;
      setIsLoggedIn(!!currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      const [creditRes, exRes, collectionRes] = await Promise.all([
        fetch("/api/credit-data"),
        fetch("/api/exceptions"),
        fetch("/api/collection-data"),
      ]);

      const creditJson = await creditRes.json();
      const exJson = await exRes.json();
      const collectionJson = await collectionRes.json();

      if (cancelled) return;

      setData(creditJson.data || []);
      setCollectedInvoices(collectionJson.invoices || []);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const validExceptions = (Array.isArray(exJson) ? exJson : []).filter((item: any) => {
        if (item.permanent) return true;
        const till = new Date(item.till_date);
        till.setHours(0, 0, 0, 0);
        return till >= today;
      });
      setExceptions(validExceptions);

      const { data: rules } = await supabase
        .from("credit_block_rules")
        .select("*");
      if (cancelled) return;
      setCreditRules(rules || []);

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

  const filtered = useMemo(() => {
    if (!isLoggedIn) return [];

    const normalize = (v: any) =>
      String(v || "")
        .replace(/^ATS\s+/i, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    return data
      .filter((row) => String(row["Van Code."] || "").trim() === vanCode.trim())
      .filter((row) => {
        const paymentTerm = String(row["Payment Term"] || "").trim();

        const rule = creditRules.find(
          (r) => normalize(r.payment_term) === normalize(paymentTerm)
        );

        const creditDays = Number(row["Credit_Days"]) || 0;

        const showInvoice = rule
          ? creditDays >= Number(rule.block_at_day)
          : creditDays >= 1;

        return (
          String(row["Central Invoice"] || "").trim().toUpperCase() === "NOT CENTRAL" &&
          !String(row["Invoice status (Due/ Overdue)"] || "")
            .toLowerCase()
            .includes("legal") &&
          showInvoice
        );
      })
      .filter((row) => {
        const invoiceKey = String(row["Invoice #"] || "")
          .replace(/\s/g, "")
          .toUpperCase();

        const isException = exceptions.some(
          (e: any) =>
            String(e.invoice || "").replace(/\s/g, "").toUpperCase() === invoiceKey
        );

        const isCollected = collectedInvoices.some(
          (i: any) =>
            String(i || "").replace(/\s/g, "").toUpperCase() === invoiceKey
        );

        return !isException && !isCollected;
      });
  }, [
    data,
    exceptions,
    collectedInvoices,
    creditRules,
    vanCode,
    isLoggedIn,
  ]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filtered;

    return filtered.filter(
      (r) =>
        String(r["Invoice #"] || "").toLowerCase().includes(q) ||
        String(r["Customer Name"] || "").toLowerCase().includes(q) ||
        String(r["Customer Code"] || "").toLowerCase().includes(q)
    );
  }, [filtered, search]);

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

      <button
        type="button"
        onClick={() => setShowExceptions((v) => !v)}
        className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5 flex items-center justify-between text-sm font-semibold"
      >
        <span>{t("exceptions")} ({vanExceptions.length})</span>
        {showExceptions ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {showExceptions && (
        <div className="space-y-2">
          {vanExceptions.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-5">{t("noData")}</p>
          ) : (
            vanExceptions.map((r, i) => (
              <div key={`${r.invoice}-exception-${i}`} className="bg-orange-50 rounded-2xl border border-orange-100 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{r.invoice}</p>
                  <p className="text-sm font-bold">{Number(r.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <p className="text-xs text-slate-600 truncate">{r.customerName} · {r.customerCode}</p>
                {r.exception?.reason && <p className="text-xs text-orange-700 mt-1">{r.exception.reason}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-slate-400 py-10">
          {t("loading")}
        </p>
      )}

      {!loading && searched.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">
          {t("noData")}
        </p>
      )}

      <div className="space-y-2">
        {searched.map((r, i) => (
          <div
            key={`${r["Invoice #"]}-${i}`}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm">{r["Invoice #"]}</p>
              <p className="text-sm font-bold" style={{ color: "#071d5c" }}>
                {Number(r["Credit Invoice Amount"] || 0).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {r["Customer Name"]} · {r["Customer Code"]}
            </p>
            {r["Transaction Date"] && (
              <p className="text-[11px] text-slate-400 mt-1">
                {String(r["Transaction Date"]).split("T")[0]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
