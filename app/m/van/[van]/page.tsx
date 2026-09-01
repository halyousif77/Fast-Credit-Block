"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export default function MobileVanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, dir } = useI18n();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const vanCode = decodeURIComponent(String(params.van || ""));

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [isUnblocked, setIsUnblocked] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const res = await fetch("/api/credit-data");
      const json = await res.json();
      if (cancelled) return;

      setRows(
        (json.data || []).filter((r: any) => r.van_code === vanCode)
      );

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
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.invoice || "").toLowerCase().includes(q) ||
        String(r.customer_name || "").toLowerCase().includes(q) ||
        String(r.customer_code || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

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

      <div className="space-y-2">
        {filtered.map((r, i) => (
          <div
            key={`${r.invoice}-${i}`}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm">{r.invoice}</p>
              <p className="text-sm font-bold" style={{ color: "#071d5c" }}>
                {parseFloat(r.credit_invoice_amount || 0).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 0 }
                )}
              </p>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {r.customer_name} · {r.customer_code}
            </p>
            {r.trx_date && (
              <p className="text-[11px] text-slate-400 mt-1">
                {String(r.trx_date).split("T")[0]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
