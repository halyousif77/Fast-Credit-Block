"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Truck, ChevronLeft, ChevronRight, ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export default function MobileVanListPage() {
  const { t, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

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

  const vans = useMemo(() => {
    const map: Record<
      string,
      { van_code: string; employee_name: string; count: number; amount: number }
    > = {};

    rows.forEach((r) => {
      const code = r.van_code || "—";
      if (!map[code]) {
        map[code] = {
          van_code: code,
          employee_name: r.employee_name || "",
          count: 0,
          amount: 0,
        };
      }
      map[code].count += 1;
      const amt = parseFloat(r.credit_invoice_amount);
      if (!isNaN(amt)) map[code].amount += amt;
    });

    return Object.values(map)
      .filter((v) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          v.van_code.toLowerCase().includes(q) ||
          v.employee_name.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.van_code.localeCompare(b.van_code));
  }, [rows, search]);

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

      {loading && (
        <p className="text-center text-sm text-slate-400 py-10">
          {t("loading")}
        </p>
      )}

      {!loading && vans.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">
          {t("noData")}
        </p>
      )}

      <div className="space-y-2">
        {vans.map((v) => {
          const unblocked = !!permissions[v.van_code];
          return (
            <Link
              key={v.van_code}
              href={`/m/van/${encodeURIComponent(v.van_code)}`}
              className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-white"
                  style={{ background: "#071d5c" }}
                >
                  <Truck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {v.van_code}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {v.employee_name || "—"} · {v.count} {t("invoice")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {unblocked ? (
                  <ShieldCheck size={16} className="text-green-600" />
                ) : (
                  <ShieldOff size={16} className="text-red-500" />
                )}
                <Chevron size={16} className="text-slate-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
