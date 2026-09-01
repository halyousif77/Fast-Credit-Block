"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Truck, ChevronLeft, ChevronRight, ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { storage } from "@/utils/storage";
import { useI18n } from "@/lib/i18n";
import { useRegionFilter } from "@/lib/regionFilter";

type VanSummary = {
  vanCode: string;
  employeeIds: string;
  remaining: number;
  exceptions: number;
};

function getStatusStyle(remaining: number, ex: number) {
  if (remaining === 0 && ex === 0) return "bg-green-100 text-green-700";
  if (remaining > 0 && ex === 0) return "bg-pink-100 text-pink-700";
  if (remaining === 0 && ex > 0) return "bg-orange-100 text-orange-700";
  return "bg-orange-200 text-orange-900";
}

export default function MobileVanSummaryPage() {
  const { t, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const { loading: filterLoading, filteredRows } = useRegionFilter();

  const [search, setSearch] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [collectedInvoices, setCollectedInvoices] = useState<string[]>([]);
  const [creditRules, setCreditRules] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const user = await storage.getItem("currentUser");
      if (cancelled) return;
      setIsLoggedIn(!!user);
      if (!user) return;

      const [exRes, collectionRes] = await Promise.all([
        fetch("/api/exceptions"),
        fetch("/api/collection-data"),
      ]);
      const exJson = await exRes.json();
      const collectionJson = await collectionRes.json();
      if (cancelled) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setExceptions((Array.isArray(exJson) ? exJson : []).filter((item: any) => {
        if (item.permanent) return true;
        const till = new Date(item.till_date);
        till.setHours(0, 0, 0, 0);
        return till >= today;
      }));
      setCollectedInvoices(Array.isArray(collectionJson.invoices) ? collectionJson.invoices : []);

      const [{ data: rules }, { data: perms }] = await Promise.all([
        supabase.from("credit_block_rules").select("*"),
        supabase.from("van_permissions").select("*"),
      ]);
      if (cancelled) return;
      setCreditRules(rules || []);
      const map: Record<string, boolean> = {};
      (perms || []).forEach((p: any) => { map[p.van_code] = !!p.is_unblocked; });
      setPermissions(map);
    })();

    return () => { cancelled = true; };
  }, []);

  const vans = useMemo(() => {
    if (!isLoggedIn) return [];

    const normalize = (v: any) => String(v || "")
      .replace(/^ATS\s+/i, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
    const normalizeInvoice = (v: any) => String(v || "").replace(/\s/g, "").toUpperCase();
    const collected = new Set(collectedInvoices.map(normalizeInvoice));
    const exceptionSet = new Set(exceptions.map((e: any) => normalizeInvoice(e.invoice)));

    // Use the same eligibility rule as desktop Summary, but start from the
    // mobile region-filtered rows so saved mobile filters still apply.
    const eligibleRows = filteredRows.filter((row) => {
      const rule = creditRules.find(
        (r) => normalize(r.payment_term) === normalize(row.paymentTerm)
      );
      const showInvoice = rule
        ? row.creditDays >= Number(rule.block_at_day)
        : row.creditDays >= 1;
      return String(row.centralInvoice || "").trim().toUpperCase() === "NOT CENTRAL"
        && !String(row.invoiceStatus || "").toLowerCase().includes("legal")
        && showInvoice;
    });

    const map: Record<string, { ids: Set<string>; remaining: number; exceptions: number }> = {};
    eligibleRows.forEach((row) => {
      const code = row.vanCode || "—";
      if (!map[code]) map[code] = { ids: new Set(), remaining: 0, exceptions: 0 };
      if (row.employeeAtsCode) map[code].ids.add(row.employeeAtsCode);

      const invoiceKey = normalizeInvoice(row.invoice);
      if (exceptionSet.has(invoiceKey)) map[code].exceptions += 1;
      else if (!collected.has(invoiceKey)) map[code].remaining += 1;
    });

    const q = search.trim().toLowerCase();
    return Object.entries(map)
      .map(([vanCode, info]) => ({
        vanCode,
        employeeIds: Array.from(info.ids).join(" / "),
        remaining: info.remaining,
        exceptions: info.exceptions,
      }))
      .filter((v) => !q || v.vanCode.toLowerCase().includes(q) || v.employeeIds.toLowerCase().includes(q))
      .sort((a, b) => a.vanCode.localeCompare(b.vanCode, undefined, { numeric: true }));
  }, [filteredRows, creditRules, exceptions, collectedInvoices, isLoggedIn, search]);

  const getStatusLabel = (remaining: number, ex: number) => {
    if (remaining > 0 && ex > 0) return `${remaining} ${t("remaining")} · Ex`;
    if (remaining > 0) return `${remaining} ${t("remaining")}`;
    if (remaining === 0 && ex > 0) return `Ex · ${t("allCollected")}`;
    return t("allCollected");
  };

  const togglePermission = async (vanCode: string, checked: boolean) => {
    setPermissions((prev) => ({ ...prev, [vanCode]: checked }));
    await supabase
      .from("van_permissions")
      .upsert({ van_code: vanCode, is_unblocked: checked }, { onConflict: "van_code" });

    if (checked) {
      try {
        await fetch("/api/send-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ van_code: vanCode }),
        });
      } catch {
        // best-effort push notification
      }
    }
  };

  return (
    <div className="space-y-3">
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

      {filterLoading && (
        <p className="text-center text-sm text-slate-400 py-10">{t("loading")}</p>
      )}

      {!filterLoading && vans.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">{t("noData")}</p>
      )}

      <div className="space-y-2">
        {vans.map((v) => {
          const unblocked = !!permissions[v.vanCode];
          return (
            <div
              key={v.vanCode}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/m/van/${encodeURIComponent(v.vanCode)}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-white"
                    style={{ background: "#071d5c" }}
                  >
                    <Truck size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{v.vanCode}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {t("employeeId")}: {v.employeeIds || "—"}
                    </p>
                  </div>
                </Link>
                <Chevron size={16} className="text-slate-400 shrink-0" />
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(
                    v.remaining,
                    v.exceptions
                  )}`}
                >
                  {getStatusLabel(v.remaining, v.exceptions)}
                </span>

                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  {unblocked ? (
                    <ShieldCheck size={15} className="text-green-600" />
                  ) : (
                    <ShieldOff size={15} className="text-red-500" />
                  )}
                  {t("permission")}
                  <input
                    type="checkbox"
                    disabled={!isLoggedIn}
                    checked={unblocked}
                    onChange={(e) => togglePermission(v.vanCode, e.target.checked)}
                    className="w-4 h-4 accent-blue-600 ms-1"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
