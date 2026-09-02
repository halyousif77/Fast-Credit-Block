"use client";
import { apiFetch as fetch } from "@/lib/apiCache";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Truck, FileText, ShieldCheck, ShieldOff, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useRegionFilter } from "@/lib/regionFilter";

export default function MobileHomePage() {
  const { t, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const { loading, filteredRows } = useRegionFilter();

  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [collectedInvoices, setCollectedInvoices] = useState<string[]>([]);
  const [creditRules, setCreditRules] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [permissionsRes, exceptionsRes, collectionRes, rulesRes] =
        await Promise.all([
          supabase.from("van_permissions").select("*"),
          fetch("/api/exceptions"),
          fetch("/api/collection-data"),
          supabase.from("credit_block_rules").select("*"),
        ]);

      if (cancelled) return;

      const map: Record<string, boolean> = {};
      (permissionsRes.data || []).forEach((p: any) => {
        map[String(p.van_code || "").trim().toUpperCase()] = !!p.is_unblocked;
      });
      setPermissions(map);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const exJson = await exceptionsRes.json();
      const validExceptions = (Array.isArray(exJson) ? exJson : []).filter((item: any) => {
        if (item.permanent) return true;
        if (!item.till_date) return false;
        const till = new Date(item.till_date);
        till.setHours(0, 0, 0, 0);
        return till >= today;
      });

      setExceptions(validExceptions);

      const collectionJson = await collectionRes.json();
      setCollectedInvoices(
        (collectionJson.invoices || []).map((invoice: any) =>
          String(invoice).replace(/\s/g, "").trim().toUpperCase()
        )
      );
      setCreditRules(rulesRes.data || []);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const normalize = (value: any) =>
      String(value || "")
        .replace(/^ATS\s+/i, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    const normalizeInvoice = (value: any) =>
      String(value || "").replace(/\s/g, "").trim().toUpperCase();

    const rulesMap = new Map(
      creditRules.map((rule: any) => [normalize(rule.payment_term), rule])
    );

    const exceptionSet = new Set(
      exceptions.map((item: any) => normalizeInvoice(item.invoice)).filter(Boolean)
    );
    const collectedSet = new Set(collectedInvoices);

    // Use the same base rules as the desktop dashboard:
    // NOT CENTRAL only, exclude Legal, then apply the credit blocking rule.
    const baseRows = filteredRows.filter((row: any) => {
      const isNotCentral =
        String(row.centralInvoice || "").trim().toUpperCase() === "NOT CENTRAL";
      const isLegal = String(row.invoiceStatus || "").toLowerCase().includes("legal");
      return isNotCentral && !isLegal;
    });

    const filteredData = baseRows.filter((row: any) => {
      const rule = rulesMap.get(normalize(row.paymentTerm));
      const creditDays = Number(row.creditDays) || 0;
      const showInvoice = rule
        ? creditDays >= Number(rule.block_at_day)
        : creditDays >= 1;

      return showInvoice || exceptionSet.has(normalizeInvoice(row.invoice));
    });

    const blockedRows = filteredData.filter((row: any) => {
      const invoice = normalizeInvoice(row.invoice);
      return !exceptionSet.has(invoice) && !collectedSet.has(invoice);
    });

    const vanRows = filteredData.filter((row: any) => row.vanCode);
    const allVans = new Set(vanRows.map((row: any) => normalize(row.vanCode)));
    const blockedVans = new Set(
      blockedRows.map((row: any) => normalize(row.vanCode)).filter(Boolean)
    );

    const exceptionRows = filteredData.filter((row: any) =>
      exceptionSet.has(normalizeInvoice(row.invoice))
    );

    const legalCount = exceptions.filter((item: any) => {
      if (!item.permanent) return false;
      return exceptionRows.some(
        (row: any) => normalizeInvoice(row.invoice) === normalizeInvoice(item.invoice)
      );
    }).length;

    const exceptionCount = exceptions.filter((item: any) => {
      if (item.permanent) return false;
      return exceptionRows.some(
        (row: any) => normalizeInvoice(row.invoice) === normalizeInvoice(item.invoice)
      );
    }).length;

    const activeEmployees = [...allVans].filter((van) => !blockedVans.has(van)).length;

    return {
      blockedCount: blockedRows.length,
      exceptionCount,
      legalCount,
      activeEmployees,
      employeeCount: allVans.size,
    };
  }, [filteredRows, creditRules, exceptions, collectedInvoices]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<FileText size={18} />}
          label={t("blockedInvoices")}
          value={loading ? "—" : stats.blockedCount.toLocaleString()}
          tone="red"
        />
        <StatCard
          icon={<ShieldOff size={18} />}
          label={t("exceptions")}
          value={loading ? "—" : stats.exceptionCount.toLocaleString()}
          tone="blue"
        />
        <StatCard
          icon={<ShieldCheck size={18} />}
          label={t("active")}
          value={loading ? "—" : stats.activeEmployees.toLocaleString()}
          tone="green"
        />
        <StatCard
          icon={<Truck size={18} />}
          label={t("employees")}
          value={loading ? "—" : stats.employeeCount.toLocaleString()}
          tone="blue"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">{t("legal")}</p>
          <p className="text-xl font-bold" style={{ color: "#071d5c" }}>
            {loading ? "—" : stats.legalCount.toLocaleString()}
          </p>
        </div>
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
            <p className="font-semibold text-sm">{t("vanSummary")}</p>
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
  tone?: "red" | "green" | "blue";
}) {
  const color =
    tone === "red" ? "#dc2626" : tone === "green" ? "#16a34a" : tone === "blue" ? "#2563eb" : "#071d5c";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${tone === "blue" ? "dark-mobile-blue-number" : ""}`} style={{ color }}>
        {value}
      </p>
    </div>
  );
}
