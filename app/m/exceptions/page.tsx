"use client";
import { apiFetch as fetch } from "@/lib/apiCache";


import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { storage } from "@/utils/storage";
import { useI18n } from "@/lib/i18n";
import { useRegionFilter } from "@/lib/regionFilter";

export default function MobileExceptionsPage() {
  const { t } = useI18n();
  const { rows } = useRegionFilter();

  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  const [form, setForm] = useState({
    invoice: "",
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
    (async () => {
      const user = await storage.getItem("currentUser");
      setCurrentUser(user || "");
    })();
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

  // Match the invoice number the user typed against the currently loaded
  // credit data, so the van/customer fields don't need to be entered by
  // hand - they're detected silently in the background.
  const matchedRow = useMemo(() => {
    const q = form.invoice.trim().replace(/\s/g, "").toUpperCase();
    if (!q) return null;
    return (
      rows.find((r) => String(r.invoice || "").replace(/\s/g, "").toUpperCase() === q) ||
      null
    );
  }, [form.invoice, rows]);

  const handleAdd = async () => {
    if (!form.invoice) {
      toast.error(t("noData"));
      return;
    }

    const user = (await storage.getItem("currentUser")) || "mobile";

    const res = await fetch("/api/exceptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice: form.invoice,
        van_code: matchedRow?.vanCode || "",
        customer_code: matchedRow?.customerCode || "",
        customer_name: matchedRow?.customerName || "",
        permanent: form.permanent,
        till_date: form.permanent
          ? "2099-12-31"
          : form.till_date || "2099-12-31",
        created_by: user,
      }),
    });

    const json = await res.json();

    if (json.success) {
      toast.success(t("save"));
      setShowAdd(false);
      setForm({ invoice: "", permanent: true, till_date: "" });
      load();
    } else {
      toast.error(json.error || "Error");
    }
  };

  const handleDelete = async (e: any) => {
    if (e.created_by !== currentUser) {
      toast.error(t("onlyDeleteOwn"));
      return;
    }

    const res = await fetch(`/api/exceptions/${e.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestedBy: currentUser }),
    });
    const json = await res.json();

    if (!json.success) {
      toast.error(json.error || t("onlyDeleteOwn"));
      return;
    }

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
                  {e.van_code} · {e.customer_code ? `${e.customer_code} · ` : ""}{e.customer_name}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {e.permanent
                    ? t("permanent")
                    : `${t("tillDate")}: ${String(e.till_date).split("T")[0]}`}
                </p>
                <p className="text-[11px] text-slate-400">
                  {t("addedBy")}: {e.created_by}
                </p>
              </div>

              {e.created_by === currentUser && (
                <button
                  onClick={() => handleDelete(e)}
                  className="h-9 w-9 shrink-0 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              )}
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
              <div>
                <input
                  placeholder={t("invoice")}
                  value={form.invoice}
                  onChange={(e) =>
                    setForm({ ...form, invoice: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm"
                />
                {form.invoice.trim() && (
                  <p
                    className={`text-[11px] mt-1 px-1 ${
                      matchedRow ? "text-green-600" : "text-orange-500"
                    }`}
                  >
                    {matchedRow
                      ? `${t("autoDetected")}: ${matchedRow.vanCode} · ${matchedRow.customerCode || ""} · ${matchedRow.customerName}`
                      : t("invoiceNotFound")}
                  </p>
                )}
              </div>

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
