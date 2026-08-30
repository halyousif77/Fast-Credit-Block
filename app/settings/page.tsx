"use client";
import { addLog } from "@/lib/activityLog";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Upload,
  FileText,
  AlertCircle,
  BarChart3,
  Settings,
  Users,
  LogOut,
    ClipboardList,
  PieChart,
} from "lucide-react";

export default function SettingsPage() {
  const [isSavingRules, setIsSavingRules] = useState(false);
const [isResettingRules, setIsResettingRules] = useState(false);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [creditRules, setCreditRules] = useState<any[]>([]);
const [loadingRules, setLoadingRules] = useState(false);
  const [isImportingUsers, setIsImportingUsers] =
  useState(false);

const [showImportModal, setShowImportModal] =
  useState(false);

const [isUploadingCredit, setIsUploadingCredit] =
  useState(false);

const [isUploadingCollection,
  setIsUploadingCollection] =
  useState(false);

const isBusy =
  isUploadingCredit ||
  isUploadingCollection ||
  isImportingUsers;
  const handleImport = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {

  if (isImportingUsers) return;

  setIsImportingUsers(true);

  try {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = async (e) => {

      try {

        const workbook = XLSX.read(
          e.target?.result,
          {
            type: "binary",
          }
        );
const sheet =
  workbook.Sheets[
    workbook.SheetNames[0]
  ];

// Validate Users File
const a1 = String(
  sheet["A1"]?.v || ""
).trim();

if (a1 !== "User Account") {

  toast.error(
    "Invalid Users File"
  );

  return;
}

const rows: any[] =
  XLSX.utils.sheet_to_json(sheet);

        const usersData =
          rows.map((row) => ({
            region: row["Region"] || "",
            city: row["City"] || "",
            organization_code:
              row["Organization Code"] || "",
            user_code:
              row["User Code"] || "",
            organization_name:
              row["Organization Name"] || "",
            van_sub_inventory:
              row["Van Sub Inventory"] || "",
            contact:
              row["Contact"] || "",
          }));

        const currentUser =
  await localStorage.getItem(
    "currentUser"
  );

await fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type":
      "application/json",
  },
  body: JSON.stringify({
    users: usersData,
    uploadedBy: currentUser,
  }),
});
   
        let fullName = "";

        if (currentUser) {

          const { data: user } =
            await supabase
              .from("app_users")
              .select("full_name")
              .eq(
                "username",
                currentUser
              )
              .single();

          fullName =
            user?.full_name || "";
        }

        await addLog(
          currentUser || "",
          fullName,
          "IMPORT_USERS",
          `${usersData.length} users`
        );

        setShowImportModal(false);

        window.location.reload();

      } finally {

        setIsImportingUsers(false);

      }

    };

    reader.readAsBinaryString(file);

  } catch {

    setIsImportingUsers(false);

  }

};
const handleCreditImport = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {

  if (isUploadingCredit) return;

  setIsUploadingCredit(true);

  try {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const buffer =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(buffer, {
        type: "array",
      });

    const worksheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const b6 = String(
      worksheet["B6"]?.v || ""
    ).trim();

    if (b6 !== "Region") {

      toast.error(
        "Invalid Credit File"
      );

      return;
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    await fetch(
      "/api/credit-upload",
      {
        method: "POST",
        body: formData,
      }
    );
await supabase
  .from("van_permissions")
  .delete()
  .neq("van_code", "");

    const currentUser =
      await localStorage.getItem(
        "currentUser"
      );

    let fullName = "";

    if (currentUser) {

      const { data: user } =
        await supabase
          .from("app_users")
          .select("full_name")
          .eq(
            "username",
            currentUser
          )
          .single();

      fullName =
        user?.full_name || "";
    }

    await addLog(
      currentUser || "",
      fullName,
      "IMPORT_CREDIT",
      file.name
    );

    setShowImportModal(false);

    window.location.reload();

  } finally {

    setIsUploadingCredit(false);

  }

};
const handleCollectionImport = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {

  if (isUploadingCollection)
    return;

  setIsUploadingCollection(true);

  try {

    const file =
      event.target.files?.[0];

    if (!file) return;

    const buffer =
      await file.arrayBuffer();

    const workbook =
      XLSX.read(buffer, {
        type: "array",
      });

    const worksheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const a1 = String(
      worksheet["A1"]?.v || ""
    ).trim();

    if (
      a1 !==
      "Collection Submit Time"
    ) {

      toast.error(
        "Invalid Collection File"
      );

      return;
    }

    const currentUser =
  await localStorage.getItem(
    "currentUser"
  );

const fileName =
  `${Date.now()}-${file.name}`;

const { error: uploadError } =
  await supabase.storage
    .from("imports")
    .upload(fileName, file, {
      upsert: true,
    });

if (uploadError) {
  throw uploadError;
}

await fetch(
  "/api/collection-upload",
  {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify({
      path: fileName,
      uploadedBy: currentUser,
      originalName: file.name,
    }),
  }
);
  
    let fullName = "";

    if (currentUser) {

      const { data: user } =
        await supabase
          .from("app_users")
          .select("full_name")
          .eq(
            "username",
            currentUser
          )
          .single();

      fullName =
        user?.full_name || "";
    }

    await addLog(
      currentUser || "",
      fullName,
      "IMPORT_COLLECTION",
      file.name
    );

    setShowImportModal(false);

    window.location.reload();

  } finally {

    setIsUploadingCollection(
      false
    );

  }

};
    const [username, setUsername] = useState("");
const [fullName, setFullName] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [exceptionExpiredAlert, setExceptionExpiredAlert] =
  useState(true);
    const [exceptionDeleteAlert, setExceptionDeleteAlert] = useState(true);
    const [isUpdatingPassword, setIsUpdatingPassword] =
  useState(false);
    const [invoiceAlert, setInvoiceAlert] = useState(true);

const [exceptionAlert, setExceptionAlert] = useState(true);

const [creditImportAlert, setCreditImportAlert] = useState(true);

const [collectionImportAlert, setCollectionImportAlert] = useState(true);
const [showOverdue, setShowOverdue] = useState(true);
const [showDue, setShowDue] = useState(false);
const [showLegal, setShowLegal] = useState(false);

const [showNormalInvoices, setShowNormalInvoices] = useState(true);
const [showExceptionInvoices, setShowExceptionInvoices] =
  useState(true);

const [hideCollectedInvoices, setHideCollectedInvoices] =
  useState(true);

const [hideUserBlock, setHideUserBlock] =
  useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
const [showLoginModal, setShowLoginModal] = useState(false);
const [currentUser, setCurrentUser] = useState("");
  const [activeTab, setActiveTab] = useState("notifications");
  const getDefaultBlockDay = (term: string) => {

  const upper = term.toUpperCase();

  if (upper.includes("IMMEDIATE")) {
    return 1;
  }

  const match = upper.match(/ATS\s+(\d+)/);

  if (!match) {
    return 1;
  }

  return Number(match[1]) + 4;
};
const loadCreditRules = async () => {

  setLoadingRules(true);

  try {

    const { data: termsData } =
      await supabase
        .from("credit_data_full")
        .select("payment_term");

    const paymentTerms = [
  ...new Set(
    (termsData || [])
      .map((x: any) =>
        String(x.payment_term || "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean)
  ),
];

    const currentUser =
  localStorage.getItem("currentUser");

const { data: existingRules } =
  await supabase
    .from("credit_block_rules")
    .select("*")
    .eq("username", currentUser);
        const existingTerms = new Set(
  (existingRules || []).map((x: any) =>
    String(x.payment_term || "")
      .trim()
      .toUpperCase()
  )
);

const newRules = paymentTerms
  .filter(
    term =>
      !existingTerms.has(
        String(term)
          .trim()
          .toUpperCase()
      )
  )
  .map(term => ({
    username: currentUser,
    payment_term: String(term).trim(),
    block_at_day: getDefaultBlockDay(term),
  }));
   if (newRules.length > 0) {

      await supabase
        .from("credit_block_rules")
        .insert(newRules);

    }

    const { data: finalRules } =
  await supabase
    .from("credit_block_rules")
    .select("*")
    .eq("username", currentUser)
    .order("payment_term");
        setCreditRules(
      finalRules || []
    );

  } finally {

    setLoadingRules(false);

  }
};
useEffect(() => {

  const loadSettings = async () => {

    const currentUser =
      localStorage.getItem("currentUser");

    if (!currentUser) return;

    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("username", currentUser)
      .single();

    if (data) {
      setUserSettings(data);
    }

  };

  loadSettings();

}, []);
  useEffect(() => {
  const loadProfile = async () => {
    const currentUser =
      localStorage.getItem("currentUser");

    if (!currentUser) return;

    const { data } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", currentUser)
      .single();

    if (data) {
      setUsername(data.username);
      setFullName(data.full_name || "");
    }
  };

  loadProfile();
}, []);

useEffect(() => {
  const loadUser = async () => {
    const savedUser =
      await localStorage.getItem("currentUser");

    if (savedUser) {

      const { data: appUser } =
        await supabase
          .from("app_users")
          .select("role")
          .eq("username", savedUser)
          .single();

      if (appUser?.role === "user") {
        alert(
          "You do not have permission to access this page"
        );
        window.location.href =
          "/van";
        return;
      }

      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
  };

  loadUser();
}, []);
useEffect(() => {
  const loadSettings = async () => {

    const currentUser =
      localStorage.getItem("currentUser");

    if (!currentUser) return;

    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("username", currentUser)
      .single();

    if (!data) return;

setInvoiceAlert(
  data.invoice_disappeared_alert ?? true
);

setExceptionDeleteAlert(
  data.exception_delete_alert ?? true
);

setExceptionExpiredAlert(
  data.exception_expired_alert ?? true
);

setExceptionAlert(
  data.exception_alert ?? true
);

setCreditImportAlert(
  data.credit_import_alert ?? true
);

setCollectionImportAlert(
  data.collection_import_alert ?? true
);

setShowOverdue(
  data.show_overdue ?? true
);

setShowDue(
  data.show_due ?? false
);

setShowLegal(
  data.show_legal ?? false
);

setShowNormalInvoices(
  data.show_normal_invoices ?? true
);

setShowExceptionInvoices(
  data.show_exception_invoices ?? true
);

setHideCollectedInvoices(
  data.hide_collected ?? true
);

setHideUserBlock(
  data.hide_user_block ?? false
);
  };

  loadSettings();
}, []);
useEffect(() => {
  if (activeTab !== "creditRules") return;

  loadCreditRules();
}, [activeTab]);
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
 <aside className="w-52 bg-[#071d5c] text-white flex flex-col">

        <div className="p-4">
          <h1 className="text-xl font-bold leading-tight">
            Credit With Route Block
          </h1>
        </div>

          <nav className="px-4 space-y-2">

  <Link
    href="/"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
  >
    <LayoutDashboard size={18} />
    <span>Dashboard</span>
  </Link>

<div
  onClick={() => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setShowImportModal(true);
  }}
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition cursor-pointer"
>
  <Upload size={18} />
  <span>Import File</span>
</div>

<Link
  href={isLoggedIn ? "/logs" : "#"}
  onClick={(e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  }}
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
>
  <ClipboardList size={18} />
  <span>Logs</span>
</Link>

  <Link
    href="/exceptions"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
  >
    <AlertCircle size={18} />
    <span>Exceptions</span>
  </Link>

  <Link
    href="/summary"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
  >
    <BarChart3 size={18} />
    <span>Summary</span>
  </Link>

  <Link
    href="/reports"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
  >
    <PieChart size={18} />
    <span>Reports</span>
  </Link>

<Link
  href={isLoggedIn ? "/settings" : "#"}
  onClick={(e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  }}
    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600"
>
  <Settings size={18} />
  <span>Settings</span>
</Link>

  

  <Link
    href="/users"
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
  >
    <Users size={18} />
    <span>Users</span>
  </Link>

</nav>
<div className="p-6 border-t border-white/10">

  {isLoggedIn ? (

    <div
      className="flex items-center gap-3 bg-red-600 p-3 rounded-lg cursor-pointer"
      onClick={() => {
        localStorage.removeItem("currentUser");
        setIsLoggedIn(false);
      }}
    >
      <LogOut size={18} />
      Logout
    </div>

  ) : (

    <div
      className="flex items-center gap-3 bg-blue-600 p-3 rounded-lg cursor-pointer"
      onClick={() => setShowLoginModal(true)}
    >
      <Users size={18} />
      Login
    </div>

  )}

</div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <div className="flex gap-6">
          {/* Left Menu */}
          <div className="w-64 border rounded-lg p-3 bg-white">


<button
  onClick={() => setActiveTab("notifications")}
  className={`w-full text-left px-4 py-3 rounded-lg mb-2 ${
    activeTab === "notifications"
      ? "bg-blue-100 text-blue-600"
      : "hover:bg-gray-100"
  }`}
>
  🔔 Notifications
</button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full text-left px-4 py-3 rounded-lg ${
                activeTab === "security"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              }`}
            >
              🔒 Security
            </button>
            <button
  onClick={() => setActiveTab("creditRules")}
  className={`w-full text-left px-4 py-3 rounded-lg ${
    activeTab === "creditRules"
      ? "bg-blue-100 text-blue-600"
      : "hover:bg-gray-100"
  }`}
>
  🚫 Credit Block Rules
</button>

          </div>

          {/* Right Content */}
          <div className="flex-1 border rounded-lg p-6 bg-white">
            {activeTab === "dashboardFilters" && (
  <>
    <h2 className="text-2xl font-semibold mb-2">
      Dashboard Filters
    </h2>

    <p className="text-gray-500 mb-8">
      Configure which invoices appear on the dashboard.
    </p>

    <div className="space-y-8">

      <div>
        <h3 className="font-semibold mb-3">
          Invoice Status
        </h3>

        <div className="space-y-3">

          <label className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={showOverdue}
              onChange={(e) =>
                setShowOverdue(e.target.checked)
              }
            />
            Overdue
          </label>

          <label className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={showDue}
              onChange={(e) =>
                setShowDue(e.target.checked)
              }
            />
            Due
          </label>

          <label className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={showLegal}
              onChange={(e) =>
                setShowLegal(e.target.checked)
              }
            />
            Legal
          </label>

        </div>
      </div>

      <hr />

      <div>
        <h3 className="font-semibold mb-3">
          Invoice Type
        </h3>

        <div className="space-y-3">

          <label className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={showNormalInvoices}
              onChange={(e) =>
                setShowNormalInvoices(
                  e.target.checked
                )
              }
            />
            Normal Invoices
          </label>

          <label className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={showExceptionInvoices}
              onChange={(e) =>
                setShowExceptionInvoices(
                  e.target.checked
                )
              }
            />
            Exception Invoices
          </label>

        </div>
      </div>

      <hr />

      <div>
        <h3 className="font-semibold mb-3">
          Invoice Visibility
        </h3>

        <div className="space-y-3">

          <label className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={hideCollectedInvoices}
              onChange={(e) =>
                setHideCollectedInvoices(
                  e.target.checked
                )
              }
            />
            Hide Fully Collected Invoices
          </label>

          <label className="flex gap-3 items-center">
            <input
              type="checkbox"
              checked={hideUserBlock}
              onChange={(e) =>
                setHideUserBlock(
                  e.target.checked
                )
              }
            />
            Hide User Block
          </label>

        </div>
      </div>

<button
  disabled={isSavingRules}
  className={`px-5 py-2 rounded-lg text-white ${
    isSavingRules
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600"
  }`}
  onClick={async () => {

    if (isSavingRules) return;

    setIsSavingRules(true);

    try {

      for (const rule of creditRules) {

        await supabase
          .from("credit_block_rules")
          .update({
            block_at_day: rule.block_at_day,
          })
          .eq("id", rule.id);

      }


    } finally {

      setIsSavingRules(false);

    }

  }}
>
  {isSavingRules
    ? "Saving..."
    : "Save Changes"}
</button>

    </div>
  </>
)}
            {activeTab === "notifications" && (
              <>
                <h2 className="text-2xl font-semibold mb-2">
                  Notifications
                </h2>

                <p className="text-gray-500 mb-6">
                  Manage your notification preferences
                </p>

                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
  type="checkbox"
  checked={invoiceAlert}
  onChange={(e) =>
    setInvoiceAlert(e.target.checked)
  }
/>
                    Invoice Disappeared Alerts
                  </label>
<label className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={exceptionExpiredAlert}
    onChange={(e) =>
      setExceptionExpiredAlert(
        e.target.checked
      )
    }
  />
  Exception Expired Alerts
</label>
                  <label className="flex items-center gap-3">
                    <input
  type="checkbox"
  checked={exceptionAlert}
  onChange={(e) =>
    setExceptionAlert(e.target.checked)
  }
/>
                    Exception Add Alerts
                  </label>

<label className="flex items-center gap-3">
  <input
    type="checkbox"
    checked={exceptionDeleteAlert}
    onChange={(e) =>
      setExceptionDeleteAlert(e.target.checked)
    }
  />
  Exception Delete Alerts
</label>
                  <label className="flex items-center gap-3">
                    <input
  type="checkbox"
  checked={creditImportAlert}
  onChange={(e) =>
    setCreditImportAlert(e.target.checked)
  }
/>
                    Credit Import Alerts
                  </label>

                  <label className="flex items-center gap-3">
                    <input
  type="checkbox"
  checked={collectionImportAlert}
  onChange={(e) =>
    setCollectionImportAlert(e.target.checked)
  }
/>
                    Collection Import Alerts
                  </label>
                </div>

<button
  className="mt-6 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  onClick={async () => {

    const currentUser =
      localStorage.getItem("currentUser");

    if (!currentUser) {
      alert("Please Login First");
      return;
    }
const { data: currentSettings } =
  await supabase
    .from("user_settings")
    .select("*")
    .eq("username", currentUser)
    .single();
    const now =
  new Date().toISOString();

const { error } = await supabase
  .from("user_settings")
  .update({

    invoice_disappeared_alert:
      invoiceAlert,

    exception_alert:
      exceptionAlert,
exception_delete_alert:
  exceptionDeleteAlert,
exception_expired_alert:
  exceptionExpiredAlert,
    credit_import_alert:
      creditImportAlert,

    collection_import_alert:
      collectionImportAlert,

    disappeared_disabled_at:
  invoiceAlert
    ? currentSettings?.disappeared_disabled_at
    : (
        currentSettings?.disappeared_disabled_at ||
        now
      ),
exception_expired_disabled_at:
  exceptionExpiredAlert
    ? currentSettings?.exception_expired_disabled_at
    : (
        currentSettings?.exception_expired_disabled_at ||
        now
      ),
exception_disabled_at:
  exceptionAlert
    ? currentSettings?.exception_disabled_at
    : (
        currentSettings?.exception_disabled_at ||
        now
      ),

      exception_delete_disabled_at:
  exceptionDeleteAlert
    ? currentSettings?.exception_delete_disabled_at
    : (
        currentSettings?.exception_delete_disabled_at ||
        now
      ),

credit_disabled_at:
  creditImportAlert
    ? currentSettings?.credit_disabled_at
    : (
        currentSettings?.credit_disabled_at ||
        now
      ),

collection_disabled_at:
  collectionImportAlert
    ? currentSettings?.collection_disabled_at
    : (
        currentSettings?.collection_disabled_at ||
        now
      ),
  })
  .eq("username", currentUser);

    if (error) {
      alert("Failed To Save Settings");
      return;
    }

    alert("Settings Saved Successfully");
  }}
>
  Save Changes
</button>
              </>
            )}
            

            {activeTab === "security" && (
              <>
                <h2 className="text-2xl font-semibold mb-2">
                  Security
                </h2>

                <p className="text-gray-500 mb-6">
                  Manage your security settings
                </p>

<div className="mb-8">
  <h3 className="text-lg font-semibold mb-4">
    Profile Information
  </h3>

  <div className="space-y-4">

    <input
      type="text"
      placeholder="Username"
      value={username}
      onChange={(e) =>
        setUsername(e.target.value)
      }
      className="w-full border rounded-lg p-3"
    />

    <input
      type="text"
      placeholder="Full Name"
      value={fullName}
      onChange={(e) =>
        setFullName(e.target.value)
      }
      className="w-full border rounded-lg p-3"
    />

  </div>

  <button
    className="mt-4 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
    onClick={async () => {

  const currentUser =
    localStorage.getItem("currentUser");

  if (!currentUser) {
    alert("Please Login First");
    return;
  }

  // التحقق من عدم وجود اسم المستخدم مسبقاً
  if (username !== currentUser) {

    const { data: existingUser } =
  await supabase
    .from("app_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

    if (existingUser) {
      alert("Username Already Exists");
      return;
    }
  }

  const { error } = await supabase
    .from("app_users")
    .update({
      username,
      full_name: fullName,
    })
    .eq("username", currentUser);

  if (error) {
    alert("Failed To Update Profile");
    return;
  }

  await supabase
    .from("user_settings")
    .update({
      username,
    })
    .eq("username", currentUser);

  localStorage.setItem(
    "currentUser",
    username
  );

  setCurrentUser(username);

  alert(
    "Profile Updated Successfully"
  );
}}
  >
    Save Profile
  </button>
</div>

                <div className="space-y-4">
                  <input
  type="password"
  placeholder="Current Password"
  value={currentPassword}
  onChange={(e) => setCurrentPassword(e.target.value)}
  className="w-full border rounded-lg p-3"
/>
  <input
  type="password"
  placeholder="New Password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  className="w-full border rounded-lg p-3"
/>
  <input
  type="password"
  placeholder="Confirm New Password"
  value={confirmPassword}
  onChange={(e) => setConfirmPassword(e.target.value)}
  className="w-full border rounded-lg p-3"
/>
                </div>



<button
  disabled={isUpdatingPassword}
  className={`mt-6 px-5 py-2 text-white rounded-lg ${
    isUpdatingPassword
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
  onClick={async () => {

    if (isUpdatingPassword) return;

    setIsUpdatingPassword(true);

    try {

      const username =
        localStorage.getItem("currentUser");

      if (!username) {
        alert("Please Login First");
        return;
      }

      if (!currentPassword) {
        alert("Enter Current Password");
        return;
      }

      if (!newPassword) {
        alert("Enter New Password");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("Passwords Do Not Match");
        return;
      }

      const { data: user } = await supabase
        .from("app_users")
        .select("*")
        .eq("username", username)
        .single();

      if (!user) {
        alert("User Not Found");
        return;
      }

      if (user.password !== currentPassword) {
        alert("Current Password Is Incorrect");
        return;
      }

      const { error } = await supabase
        .from("app_users")
        .update({
          password: newPassword,
        })
        .eq("username", username);

      if (error) {
        alert("Failed To Update Password");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      alert("Password Updated Successfully");

    } finally {

      setIsUpdatingPassword(false);

    }

  }}
>
  {isUpdatingPassword
    ? "Updating..."
    : "Update Password"}
</button>
              </>
            )}

{activeTab === "creditRules" && (
  <>
    <h2 className="text-2xl font-semibold mb-2">
      Credit Block Rules
    </h2>

    <p className="text-gray-500 mb-6">
      Configure invoice block thresholds.
    </p>

    {loadingRules ? (
      <div>Loading...</div>
    ) : (
      <>
        <div className="space-y-3">

          {creditRules.map((rule, index) => (

            <div
              key={rule.id}
              className="flex items-center justify-between border rounded-lg p-3"
            >

              <div className="font-medium">
                {rule.payment_term}
              </div>

              <input
                type="number"
                value={rule.block_at_day}
                onChange={(e) => {

                  const updated =
                    [...creditRules];

                  updated[index] = {
                    ...updated[index],
                    block_at_day:
                      Number(e.target.value),
                  };

                  setCreditRules(updated);

                }}
                className="border rounded-lg px-3 py-2 w-28 text-center"
              />

            </div>

          ))}

        </div>

        <div className="mt-6 flex gap-3">

          <button
  disabled={isSavingRules || isResettingRules}
  className={`px-5 py-2 rounded-lg text-white ${
    isSavingRules || isResettingRules
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-600"
  }`}
  onClick={async () => {

    if (isSavingRules || isResettingRules)
      return;

    setIsSavingRules(true);

    try {

      for (const rule of creditRules) {

        await supabase
          .from("credit_block_rules")
          .update({
            block_at_day: rule.block_at_day,
          })
          .eq("id", rule.id);

      }

    

    } finally {

      setIsSavingRules(false);

    }

  }}
>
  {isSavingRules
    ? "Saving..."
    : "Save Changes"}
</button>

<button
disabled={isSavingRules || isResettingRules}
    className={`px-5 py-2 rounded-lg text-white ${
    isResettingRules
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-red-600"
  }`}
  onClick={async () => {
if (isSavingRules || isResettingRules)
  return;
    

    setIsResettingRules(true);

    try {

      for (const rule of creditRules) {

        await supabase
          .from("credit_block_rules")
          .update({
            block_at_day:
              getDefaultBlockDay(
                rule.payment_term
              ),
          })
          .eq("id", rule.id);

      }

      await loadCreditRules();


    } finally {

      setIsResettingRules(false);

    }

  }}
>
  {isResettingRules
    ? "Resetting..."
    : "Reset To Default"}
</button>

        </div>

      </>
    )}
  </>
)}

</div>
            
         
        </div>
      </main>
      {showLoginModal && (

  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">

    <div className="bg-white w-[420px] rounded-2xl shadow-2xl p-8">

      <h2 className="text-3xl font-bold text-slate-800 mb-6">
        Welcome Back
      </h2>

      <input
        type="text"
        placeholder="Username"
        value={currentUser}
        onChange={(e) =>
          setCurrentUser(e.target.value)
        }
        className="w-full border p-3 rounded-xl mb-4"
      />
<input
  type="password"
  placeholder="Password"
  value={loginPassword}
  onChange={(e) => setLoginPassword(e.target.value)}
  className="w-full border p-3 rounded-xl mb-4"
/>
      <button
  className="w-full bg-blue-600 text-white py-3 rounded-xl"
  onClick={async () => {

    if (!currentUser || !loginPassword) {
      alert("Enter Username And Password");
      return;
    }

    const { data: user, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", currentUser)
      .single();

    if (error || !user) {
      alert("User Not Found");
      return;
    }

    if (user.password !== loginPassword) {
      alert("Invalid Password");
      return;
    }

    localStorage.setItem(
      "currentUser",
      currentUser
    );

    setIsLoggedIn(true);
    setShowLoginModal(false);

    setLoginPassword("");

  
  }}
>
  Login
</button>

      <button
        className="w-full mt-3 border py-3 rounded-xl"
        onClick={() =>
          setShowLoginModal(false)
        }
      >
        Cancel
      </button>

    </div>

  </div>

)}
{showImportModal && (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
    onClick={() => {

      if (isBusy) return;

      setShowImportModal(false);

    }}
  >
    <div
      className="bg-white w-[540px] rounded-3xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="bg-[#071d5c] text-white px-6 py-5 flex items-center justify-between">

  <div>

    <h2 className="text-2xl font-bold">
      Import Files
    </h2>

    <p className="text-blue-100 text-sm mt-1">
      Upload and process system files
    </p>

  </div>

  <button
    disabled={isBusy}
    onClick={() => {

      if (isBusy) return;

      setShowImportModal(false);

    }}
    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
      isBusy
        ? "opacity-40 cursor-not-allowed"
        : "hover:bg-white/20"
    }`}
  >
    ✕
  </button>

</div>

      

      <div className="p-6 space-y-4">

  {/* Import Collection */}
  <label
    className={`block rounded-2xl transition-all duration-200 ${
      isUploadingCollection
        ? "bg-slate-300 cursor-not-allowed"
        : "bg-green-600 hover:bg-green-700 hover:scale-[1.02] cursor-pointer"
    }`}
  >
    <div className="p-5 text-white text-center">

      <div className="text-lg font-bold">
        {isUploadingCollection
          ? "Uploading Collection..."
          : "Import Collection"}
      </div>

      <div className="text-sm text-green-100 mt-1">
        Collected Invoices File
      </div>

    </div>

    <input
      type="file"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={handleCollectionImport}
      disabled={isUploadingCollection}
    />
  </label>

  {/* Import Users */}
  <label
    className={`block rounded-2xl transition-all duration-200 ${
      isImportingUsers
        ? "bg-slate-300 cursor-not-allowed"
        : "bg-purple-600 hover:bg-purple-700 hover:scale-[1.02] cursor-pointer"
    }`}
  >
    <div className="p-5 text-white text-center">

      <div className="text-lg font-bold">
        {isImportingUsers
          ? "Importing Users..."
          : "Import Users"}
      </div>

      <div className="text-sm text-purple-100 mt-1">
        Users &amp; Van Mapping File
      </div>

    </div>

    <input
      type="file"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={handleImport}
      disabled={isImportingUsers}
    />
  </label>

  {/* Import Credit */}
  <label
    className={`block rounded-2xl transition-all duration-200 ${
      isUploadingCredit
        ? "bg-slate-300 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] cursor-pointer"
    }`}
  >
    <div className="p-5 text-white text-center">

      <div className="text-lg font-bold">
        {isUploadingCredit
          ? "Uploading Credit..."
          : "Import Credit"}
      </div>

      <div className="text-sm text-blue-100 mt-1">
        Credit Block File
      </div>

    </div>

    <input
      type="file"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={handleCreditImport}
      disabled={isUploadingCredit}
    />
     </label>

      </div>
    </div>
  </div>
)}

</div>

);
}