"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  Users2,
  ScrollText,
  Bell,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addLog } from "@/lib/activityLog";
import { useI18n } from "@/lib/i18n";

export default function MobileMorePage() {
  const { t, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const [showImportModal, setShowImportModal] = useState(false);
  const [isImportingUsers, setIsImportingUsers] = useState(false);
  const [isUploadingCredit, setIsUploadingCredit] = useState(false);
  const [isUploadingCollection, setIsUploadingCollection] = useState(false);

  const currentUser =
    typeof window !== "undefined"
      ? localStorage.getItem("currentUser") || ""
      : "";

  const getFullName = async () => {
    if (!currentUser) return "";
    const { data: user } = await supabase
      .from("app_users")
      .select("full_name")
      .eq("username", currentUser)
      .single();
    return user?.full_name || "";
  };

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isImportingUsers) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImportingUsers(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const a1 = String(sheet["A1"]?.v || "").trim();

      if (a1 !== "User Account") {
        toast.error("Invalid Users File");
        return;
      }

      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      const usersData = rows.map((row) => ({
        region: row["Region"] || "",
        city: row["City"] || "",
        organization_code: row["Organization Code"] || "",
        user_code: row["User Code"] || "",
        organization_name: row["Organization Name"] || "",
        van_sub_inventory: row["Van Sub Inventory"] || "",
        contact: row["Contact"] || "",
      }));

      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: usersData, uploadedBy: currentUser }),
      });
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Failed to import users");
      }

      const fullName = await getFullName();
      await addLog(
        currentUser,
        fullName,
        "IMPORT_USERS",
        `${usersData.length} users`
      );

      toast.success("Users imported successfully");
      setShowImportModal(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to import users");
    } finally {
      setIsImportingUsers(false);
    }
  };

  const handleCreditImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isUploadingCredit) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingCredit(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const b6 = String(worksheet["B6"]?.v || "").trim();

      if (b6 !== "Region") {
        toast.error("Invalid Credit File", {
          description: "Please upload the correct Credit report.",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadedBy", currentUser);

      const uploadResponse = await fetch("/api/credit-upload", {
        method: "POST",
        body: formData,
      });
      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || "Credit upload failed");
      }

      await supabase.from("van_permissions").delete().neq("van_code", "");

      const fullName = await getFullName();
      await addLog(currentUser, fullName, "IMPORT_CREDIT", file.name);

      await fetch("/api/collection-reset", { method: "POST" });
      localStorage.removeItem("vanPermissions");
      localStorage.removeItem("lastUpdatedVans");
      localStorage.removeItem("collectedInvoices");
      localStorage.removeItem("collectionFileInfo");

      toast.success("Credit file imported successfully");
      setShowImportModal(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to import credit file");
    } finally {
      setIsUploadingCredit(false);
    }
  };

  const handleCollectionImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isUploadingCollection) return;
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingCollection(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const a1 = String(worksheet["A1"]?.v || "").trim();

      if (a1 !== "Collection Submit Time") {
        toast.error("Invalid Collection File", {
          description: "Please upload the correct Collection report.",
        });
        return;
      }

      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("imports")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const response = await fetch("/api/collection-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: fileName,
          uploadedBy: currentUser,
          originalName: file.name,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Collection upload failed");
      }

      const fullName = await getFullName();
      await addLog(currentUser, fullName, "IMPORT_COLLECTION", file.name);

      toast.success("Collection file imported successfully");
      setShowImportModal(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to import collection file");
    } finally {
      setIsUploadingCollection(false);
    }
  };

  const isBusy =
    isImportingUsers || isUploadingCredit || isUploadingCollection;

  const items = [
    { href: "/m/reports", label: t("reports"), icon: FileBarChart, color: "#0b2a7a" },
    { href: "/m/users", label: t("users"), icon: Users2, color: "#071d5c" },
    { href: "/m/logs", label: t("logs"), icon: ScrollText, color: "#0b2a7a" },
    { href: "/m/notifications-admin", label: t("notifications"), icon: Bell, color: "#071d5c" },
  ];

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ background: item.color }}>
                <Icon size={19} />
              </div>
              <p className="font-semibold text-sm">{item.label}</p>
            </div>
            <Chevron size={18} className="text-slate-400" />
          </Link>
        );
      })}

      <button
        onClick={() => setShowImportModal(true)}
        className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:scale-[0.98] transition-transform text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ background: "#071d5c" }}>
            <Upload size={19} />
          </div>
          <p className="font-semibold text-sm">Import Files</p>
        </div>
        <Chevron size={18} className="text-slate-400" />
      </button>

      {showImportModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => !isBusy && setShowImportModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#071d5c] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Import Files</h2>
                <p className="text-blue-100 text-xs mt-1">Upload and process system files</p>
              </div>
              <button
                disabled={isBusy}
                onClick={() => !isBusy && setShowImportModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className={`block rounded-2xl ${isUploadingCollection ? "bg-slate-300" : "bg-green-600 active:scale-[0.98]"}`}>
                <div className="p-5 text-white text-center">
                  <div className="font-bold">{isUploadingCollection ? "Uploading Collection..." : "Import Collection"}</div>
                  <div className="text-xs text-green-100 mt-1">Collected Invoices File</div>
                </div>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleCollectionImport} disabled={isBusy} />
              </label>

              <label className={`block rounded-2xl ${isImportingUsers ? "bg-slate-300" : "bg-purple-600 active:scale-[0.98]"}`}>
                <div className="p-5 text-white text-center">
                  <div className="font-bold">{isImportingUsers ? "Importing Users..." : "Import Users"}</div>
                  <div className="text-xs text-purple-100 mt-1">Users &amp; Van Mapping File</div>
                </div>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={isBusy} />
              </label>

              <label className={`block rounded-2xl ${isUploadingCredit ? "bg-slate-300" : "bg-blue-600 active:scale-[0.98]"}`}>
                <div className="p-5 text-white text-center">
                  <div className="font-bold">{isUploadingCredit ? "Uploading Credit..." : "Import Credit"}</div>
                  <div className="text-xs text-blue-100 mt-1">Credit Block File</div>
                </div>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleCreditImport} disabled={isBusy} />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
