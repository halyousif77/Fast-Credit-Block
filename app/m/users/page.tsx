"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, UserCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export default function MobileUsersPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("app_users").select("*");
      if (cancelled) return;
      setUsers(data || []);
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

      {!loading && users.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10">{t("noData")}</p>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u.id ?? u.username}
            className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0"
              style={{ background: "#071d5c" }}
            >
              <UserCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {u.full_name || u.username}
              </p>
              <p className="text-xs text-slate-500 truncate">@{u.username}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
