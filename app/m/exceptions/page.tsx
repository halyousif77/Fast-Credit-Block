"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { storage } from "@/utils/storage";
import { useI18n } from "@/lib/i18n";

export default function MobileExceptionsPage() {
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    van_code: "",
    invoice: "",
    customer_code: "",
    customer_name: "",
    permanent: true,
    till_date: "",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/exceptions");
    const json = await res.json();
    setExceptions(Array.isArray(json) ? json : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = exceptions.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(e.invoice || "").toLowerCase().includes(q) ||
      String(e.van_code || "").toLowerCase().includes(q) ||
      String(e.customer_name || "").toLowerCase().includes(q)
    );
  });

  const handleAdd = async () => {
    if (!form.invoice || !form.van_code) {
      toast.error(t("noData"));
      return;
    }

    const currentUser = (await storage.getItem("currentUser")) || "mobile";

    const res = await fetch("/api/exceptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice: form.invoice,
        van_code: form.van_code,
        customer_code: form.customer_code,
        customer_name: form.customer_name,
        permanent: form.permanent,
        till_date: form.permanent
          ? "2099-12-31"
          : form.till_date || "2099-12-31",
        created_by: currentUser,
      }),
    });

    const json = await res.json();

    if (json.success) {
      toast.success(t("save"));
      setShowAdd(false);
      setForm({
        van_code: "",
        invoice: "",
        customer_code: "",
        customer_name: "",
        permanent: true,
        till_date: "",
      });
      load();
    } else {
      toast.error(json.error || "Error");
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/exceptions/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
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
          onClick={() => setShowAdd(true)}
          className="h-10 w-10 shrink-0 rounded-xl text-white flex items-center justify-center"
          style={{ background: "#071d5c" }}
        >
          <Plus size={20} />
        </button>
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
        {filtered.map((e) => (
          <div
            key={e.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {e.invoice}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {e.van_code} · {e.customer_name}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {e.permanent
                    ? t("permanent")
                    : `${t("tillDate")}: ${String(e.till_date).split("T")[0]}`}
                </p>
              </div>

              <button
                onClick={() => handleDelete(e.id)}
                className="h-9 w-9 shrink-0 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-base">{t("addException")}</p>
              <button onClick={() => setShowAdd(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder={t("van")}
                value={form.van_code}
                onChange={(e) =>
                  setForm({ ...form, van_code: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3 text-sm"
              />
              <input
                placeholder={t("invoice")}
                value={form.invoice}
                onChange={(e) =>
                  setForm({ ...form, invoice: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3 text-sm"
              />
              <input
                placeholder={t("customer")}
                value={form.customer_name}
                onChange={(e) =>
                  setForm({ ...form, customer_name: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3 text-sm"
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.permanent}
                  onChange={(e) =>
                    setForm({ ...form, permanent: e.target.checked })
                  }
                />
                {t("permanent")}
              </label>

              {!form.permanent && (
                <input
                  type="date"
                  value={form.till_date}
                  onChange={(e) =>
                    setForm({ ...form, till_date: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm"
                />
              )}

              <button
                onClick={handleAdd}
                className="w-full text-white py-3 rounded-xl font-medium"
                style={{ background: "#071d5c" }}
              >
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
