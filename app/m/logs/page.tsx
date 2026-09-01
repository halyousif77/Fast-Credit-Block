"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ScrollText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export default function MobileLogsPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      setLogs(data || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

      {!loading && logs.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">{t("noData")}</p>
      )}

      <div className="space-y-2">
        {logs.map((log, i) => (
          <div
            key={log.id ?? i}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5"
          >
            <div className="flex items-center gap-2 mb-1">
              <ScrollText size={14} style={{ color: "#071d5c" }} />
              <p className="font-semibold text-sm truncate">{log.action}</p>
            </div>
            <p className="text-xs text-slate-500 truncate">{log.details}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {log.full_name || log.username} ·{" "}
              {log.created_at
                ? new Date(log.created_at).toLocaleString()
                : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
