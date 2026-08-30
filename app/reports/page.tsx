"use client";
import { addLog } from "@/lib/activityLog";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
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
import { useEffect, useState } from "react";
import { storage as localStorage } from "@/utils/storage";


export default function ReportsPage() {
  const [missingLoaded, setMissingLoaded] =
  useState(false);
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
  const [missingInvoices, setMissingInvoices] =
  useState<any[]>([]);
  const [filteredCreditData, setFilteredCreditData] =
  useState<any[]>([]);
const [isLoggedIn, setIsLoggedIn] =
  useState(false);

const [showLoginModal, setShowLoginModal] =
  useState(false);

const [username, setUsername] =
  useState("");

const [password, setPassword] =
  useState("");

const [currentUser, setCurrentUser] =
  useState("");

  const [creditData, setCreditData] =
    useState<any[]>([]);

  const [collections, setCollections] =
    useState<any[]>([]);

  const [selectedTab, setSelectedTab] =
    useState("credit");
const [searchText, setSearchText] =
  useState("");
  const [collectionRows, setCollectionRows] =
    useState<any[]>([]);
useEffect(() => {

  const loadFilters = async () => {

    const currentUser =
  await localStorage.getItem(
    "currentUser"
  );

const filterKey = currentUser
  ? `savedFilters_${currentUser}`
  : "savedFilters_guest";

const saved =
  await localStorage.getItem(
    filterKey
  );
    if (!saved) {

      setFilteredCreditData(
        creditData
      );

      return;

    }

    const filters =
      JSON.parse(saved);

    const filtered =
      creditData.filter((row) => {

        const regionMatch =
          filters.regions?.length === 0 ||
          filters.regions?.includes(
            row.region
          );

        const cityMatch =
          filters.cities?.length === 0 ||
          filters.cities?.includes(
            row.city
          );

        const vanMatch =
          filters.vans?.length === 0 ||
          filters.vans?.includes(
            row.van_code
          );

        return (
          regionMatch &&
          cityMatch &&
          vanMatch
        );

      });

    setFilteredCreditData(
      filtered
    );

  };

  loadFilters();

}, [creditData]);

useEffect(() => {

  const loadUser = async () => {

    const savedUser =
      await localStorage.getItem(
        "currentUser"
      );

    if (savedUser) {

      const { data: appUser } =
        await supabase
          .from("app_users")
          .select("role")
          .eq("username", savedUser)
          .single();

      if (
        appUser?.role === "user"
      ) {
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

  const loadData = async () => {

    const response =
      await fetch("/api/reports");

    const data =
      await response.json();

    setCreditData(
      data.creditData || []
    );

    setCollections(
      data.collections || []
    );

  };

  loadData();

}, []);

useEffect(() => {

  const loadMissingInvoices =
    async () => {

      try {

        const response =
          await fetch(
            "/api/reports/missing"
          );

        const data =
          await response.json();

        const currentUser =
          await localStorage.getItem(
            "currentUser"
          );

        const filterKey =
          currentUser
            ? `savedFilters_${currentUser}`
            : "savedFilters_guest";

        const saved =
          await localStorage.getItem(
            filterKey
          );

        if (!saved) {
          setMissingInvoices(data);
          return;
        }

        const filters =
          JSON.parse(saved);

        const filtered =
          data.filter((row: any) => {

            const regionMatch =
              filters.regions?.length === 0 ||
              filters.regions?.includes(
                row.region
              );

            const cityMatch =
              filters.cities?.length === 0 ||
              filters.cities?.includes(
                row.city
              );

            return (
  regionMatch &&
  cityMatch
);
          });

        setMissingInvoices(filtered);

      } finally {

        setMissingLoaded(true);

      }

    };

  loadMissingInvoices();

}, []);
  const loadCollection =
    async (id: number) => {

      const response =
        await fetch(
          `/api/reports/${id}`
        );

      const data =
        await response.json();

      setCollectionRows(data);

    };
    
const q = searchText.toLowerCase();

const filteredCreditRows =
  filteredCreditData
    .filter((row) =>

      String(row.invoice || "")
        .toLowerCase()
        .includes(q)

      ||

      String(row.customer_name || "")
        .toLowerCase()
        .includes(q)

      ||

      String(row.customer_code || "")
        .toLowerCase()
        .includes(q)

      ||

      String(row.van_code || "")
        .toLowerCase()
        .includes(q)

    )
    .sort((a, b) =>
      String(a.van_code || "")
        .localeCompare(
          String(b.van_code || "")
        )
    );
    const displayedRows =
  filteredCreditRows.slice(0, 200);
          const filteredCollectionRows =
  collectionRows.filter((row) =>

    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(
        searchText.toLowerCase()
      )

  );
  const orderedColumns = [
  "region",
  "city",
  "van_code",
  "employee_name",
  "employee_ats_code",
  "customer_code",
  "customer_name",
  "central_invoice",
  "payment_term",
  "invoice",
  "trx_date",
  "credit_invoice_amount",
  "collect_amount",
  "pending_cim",
  "credit_days",
  "invoice_status",
  "status_user_block",
  "total_rejected_count",
];
return (

<div className="min-h-screen bg-[#f4f7fc] flex text-slate-900">

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
    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600"
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
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
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

  <main className="flex-1 p-6">

      <h1 className="text-3xl font-bold mb-6">
        Reports
      </h1>
    {missingLoaded && (
  <div
    className="
      bg-white
      border
      border-amber-200
      rounded-2xl
      shadow-sm
      p-5
      mb-6
      overflow-hidden
      max-w-full    "
  >
    <div className="flex justify-between items-center mb-4">

      <h2 className="text-xl font-bold text-amber-700">
        🚨 Disappeared Invoices
      </h2>

      <span
        className="
          bg-amber-100
          text-amber-700
          px-3
          py-1
          rounded-full
          text-sm
          font-semibold
        "
      >
        {missingInvoices.length}
      </span>

    </div>

    <div className="overflow-hidden">
  <table className="w-full text-xs table-fixed border-collapse">
    <thead>
      <tr className="bg-amber-600 text-white">

<th className="w-[110px] p-2 text-left">
  Organization Code
</th>

<th className="w-[200px] p-2 text-left">
  Organization Name
</th>

<th className="w-[140px] p-2 text-left">
  Invoice No
</th>

<th className="w-[100px] p-2 text-left">
  First Seen
</th>

        <th className="w-[100px] p-2 text-left">
          Missing From
        </th>

      </tr>
    </thead>
<tbody>

  {missingInvoices.length === 0 ? (

  <tr>
    <td
      colSpan={5}
      className="
        text-center
        py-8
        text-slate-500
      "
    >
      No disappeared invoices found
    </td>
  </tr>

) : (
    missingInvoices.map(
      (row: any, index) => (

        <tr
          key={index}
          className="
            border-b
            border-amber-100
            hover:bg-amber-50
            transition-colors
          "
        >
          <td className="p-2">
  {row.organization_code}
</td>

<td
  className="p-2 truncate"
  title={row.organization_name}
>
  {row.organization_name}
</td>

<td className="p-2 font-semibold text-slate-800">
  {row.invoice}
</td>

<td className="p-2">
  Collection {row.first_seen}
</td>

<td className="p-2">
  Collection {row.missing_from}
</td>
        </tr>

      )
    )

  )}

</tbody>
      </table>

    </div>

  </div>
)}


<div className="mb-4">

  <input
    type="text"
    placeholder="Search..."
    value={searchText}
    onChange={(e) =>
      setSearchText(e.target.value)
    }
    className="w-full max-w-md border rounded-lg px-4 py-2"
  />

</div>
      <div className="flex gap-2 mb-6">

        <button
          className={`px-4 py-2 rounded ${
            selectedTab === "credit"
              ? "bg-blue-600 text-white"
              : "bg-slate-200"
          }`}
          onClick={() =>
            setSelectedTab("credit")
          }
        >
          Credit File
        </button>

        {collections.map(
          (item: any) => (

            <button
              key={item.id}
              className={`px-4 py-2 rounded ${
                selectedTab ===
                String(item.id)
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200"
              }`}
              onClick={() => {

                setSelectedTab(
                  String(item.id)
                  
                );

                loadCollection(
                  item.id
                );

              }}
            >
              Collection {item.id}
            </button>

          )
        )}

      </div>

      {selectedTab === "credit" ? (

        <div className="overflow-auto">

<table className="w-full border">

            <thead>

  <tr className="bg-slate-800 text-white">

  {displayedRows.length > 0 &&
  [
    ...orderedColumns.filter(
      col => col in displayedRows[0]
    ),
    ...Object.keys(
      displayedRows[0]
    ).filter(
      col =>
        !orderedColumns.includes(col)
    ),
  ].map(key => (

    <th
      key={key}
      className="p-3"
    >
      {key}
    </th>

  ))
}
  </tr>

</thead>
            <tbody>
  {displayedRows.map(
        (row, index) => (

      <tr
        key={index}
        className="border-b"
      >

        {[
          ...orderedColumns.filter(
            col => col in row
          ),
          ...Object.keys(row).filter(
            col =>
              !orderedColumns.includes(col)
          ),
        ].map(
          (key, cellIndex) => (

            <td
  key={cellIndex}
  className="p-2"
>
  {key === "trx_date"
    ? row[key]
      ? new Date(
          (Number(row[key]) - 25569) *
            86400 *
            1000
        ).toLocaleDateString("en-GB")
      : ""
    : String(row[key] ?? "")}
</td>
          )
        )}

      </tr>

    )
  )}

</tbody>
          </table>

        </div>

      ) : (

        <div className="overflow-auto">

  <table className="w-full border">

    <thead>

      <tr className="bg-slate-800 text-white">

        <th className="p-3">
          Invoice
        </th>

        <th className="p-3">
          Uploaded By
        </th>

      </tr>

    </thead>

    <tbody>

      {filteredCollectionRows.map(
        (row: any) => (

          <tr
            key={row.id}
            className="border-b"
          >

            <td className="p-2">
              {row.invoice}
            </td>

            <td className="p-2">
              {row.uploaded_by}
            </td>

          </tr>

        )
      )}

    </tbody>

  </table>

</div>

      )}

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
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          className="w-full border p-3 rounded-xl mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-3 rounded-xl mb-4"
        />

        <button
          className="w-full bg-blue-600 text-white py-3 rounded-xl"
          onClick={async () => {
            

            
            const { data: user } = await supabase
  .from("app_users")
  .select("*")
  .eq("username", username)
  .single();

if (!user) {
  alert("Invalid Username");
  return;
}

if (user.password !== password) {
  alert("Invalid Password");
  return;
}

await localStorage.setItem(
  "currentUser",
  user.username
);

setCurrentUser(user.username);

setIsLoggedIn(true);

setShowLoginModal(false);

setUsername("");
setPassword("");

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