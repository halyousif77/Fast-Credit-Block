"use client";
import { apiFetch as fetch } from "@/lib/apiCache";


import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Search, X, Pencil } from "lucide-react";
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
  const [editingException, setEditingException] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  const [form, setForm] = useState({
    invoice: "",
    permanent: false,
    till_date: "",
  });

  const getTodayInput = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const normalizeTillDate = (value: string) => {
    if (!value) return "";
    const d = new Date(`${value}T00:00:00`);
    if (d.getDay() === 5) d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getDaysLeft = (date: string) => {
    if (!date) return null;
    const till = new Date(`${date}T00:00:00`);
    const today = new Date();
    till.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((till.getTime() - today.getTime()) / 86400000));
  };

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
      setForm({ invoice: "", permanent: false, till_date: "" });
      load();
    } else {
      toast.error(json.error || "Error");
    }
  };

  const openEdit = (e: any) => {
    if (e.created_by !== currentUser) {
      toast.error(t("onlyDeleteOwn"));
      return;
    }
    setEditingException(e);
    setForm({
      invoice: e.invoice || "",
      permanent: !!e.permanent,
      till_date: e.permanent ? "" : String(e.till_date || "").split("T")[0],
    });
  };

  const handleEdit = async () => {
    if (!editingException || editingException.created_by !== currentUser) return;
    if (!form.invoice.trim()) {
      toast.error(t("noData"));
      return;
    }
    if (!form.permanent && !form.till_date) {
      toast.error("Please select an expiration date");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/exceptions/${editingException.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: form.invoice.trim(),
          till_date: form.permanent ? null : form.till_date,
          updatedBy: currentUser,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Error");
        return;
      }
      toast.success(t("save"));
      setEditingException(null);
      setForm({ invoice: "", permanent: false, till_date: "" });
      load();
    } finally {
      setSavingEdit(false);
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
                {!e.permanent && e.till_date && (() => {
                  const till = new Date(e.till_date);
                  till.setHours(0, 0, 0, 0);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const daysLeft = Math.max(
                    0,
                    Math.round((till.getTime() - today.getTime()) / 86400000)
                  );
                  return (
                    <p className="text-xs font-semibold text-blue-600 mt-1 dark-mobile-exception-days">
                      {daysLeft === 0 ? "Expires today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                    </p>
                  );
                })()}
                <p className="text-[11px] text-slate-400">
                  {t("addedBy")}: {e.created_by}
                </p>
              </div>

              {e.created_by === currentUser && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(e)}
                    className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"
                    aria-label="Edit exception"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(e)}
                    className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                    aria-label="Delete exception"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
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
                <div>
                  <input
                    type="date"
                    min={getTodayInput()}
                    value={form.till_date}
                    onChange={(e) =>
                      setForm({ ...form, till_date: normalizeTillDate(e.target.value) })
                    }
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm bg-white"
                  />
                  {form.till_date && (
                    <p className="text-xs font-semibold text-blue-600 mt-1 px-1">
                      {getDaysLeft(form.till_date) === 0
                        ? "Expires today"
                        : `${getDaysLeft(form.till_date)} day${getDaysLeft(form.till_date) === 1 ? "" : "s"} left`}
                    </p>
                  )}
                </div>
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

      {editingException && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-base">Edit Exception</p>
              <button onClick={() => setEditingException(null)} disabled={savingEdit}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder={t("invoice")}
                value={form.invoice}
                onChange={(e) => setForm({ ...form, invoice: e.target.value })}
                className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm"
              />
              {!form.permanent && (
                <div>
                  <input
                    type="date"
                    min={getTodayInput()}
                    value={form.till_date}
                    onChange={(e) =>
                      setForm({ ...form, till_date: normalizeTillDate(e.target.value) })
                    }
                    className="w-full h-11 border border-slate-200 rounded-xl px-3 text-sm bg-white"
                  />
                  {form.till_date && (
                    <p className="text-xs font-semibold text-blue-600 mt-1 px-1">
                      {getDaysLeft(form.till_date) === 0
                        ? "Expires today"
                        : `${getDaysLeft(form.till_date)} day${getDaysLeft(form.till_date) === 1 ? "" : "s"} left`}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={handleEdit}
                disabled={savingEdit}
                className={`w-full text-white py-3 rounded-xl font-medium ${savingEdit ? "bg-slate-400" : "bg-[#071d5c]"}`}
              >
                {savingEdit ? "..." : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
