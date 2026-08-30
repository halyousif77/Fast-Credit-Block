"use client";
import { addLog } from "@/lib/activityLog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { storage as localStorage } from "@/utils/storage";
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
import * as XLSX from "xlsx";

export default function UsersPage() {
  
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
const handleCreditImport = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {

  if (isUploadingCredit) return;

  setIsUploadingCredit(true);

  try {

    const file =
  event.target.files?.[0];

if (!file) return;

const currentUser =
  await localStorage.getItem(
    "currentUser"
  );

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
const jobResponse = await fetch(
  "/api/import-job",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "CREDIT",
      filePath: fileName,
      fileName: file.name,
      uploadedBy: currentUser,
    }),
  }
);

const jobResult =
  await jobResponse.json();

if (
  !jobResponse.ok ||
  !jobResult.success
) {
  throw new Error(
    jobResult.error ||
    "Failed to create import job"
  );
}
setShowImportModal(false);

toast.success(
  "Credit file uploaded. Processing started."
);
await supabase
  .from("van_permissions")
  .delete()
  .neq("van_code", "");

    
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

const jobResponse = await fetch(
  "/api/import-job",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "COLLECTION",
      filePath: fileName,
      fileName: file.name,
      uploadedBy: currentUser,
    }),
  }
);

const jobResult = await jobResponse.json();

if (!jobResponse.ok || !jobResult.success) {
  throw new Error(
    jobResult.error || "Failed to create import job"
  );
}
setShowImportModal(false);

toast.success(
  "Collection file uploaded. Processing started."
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


  } finally {

    setIsUploadingCollection(
      false
    );

  }

};
    const [currentUser, setCurrentUser] =
  useState("");
  const [editingUserId, setEditingUserId] =
  useState<number | null>(null);
  const [saving, setSaving] = useState(false);

const [deletingUserId, setDeletingUserId] =
  useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [editingId, setEditingId] =
  useState<number | null>(null);

const [editData, setEditData] =
  useState<any>({});
  const [search, setSearch] = useState("");

  const [regionFilter, setRegionFilter] =
    useState("");

  const [cityFilter, setCityFilter] =
    useState("");

  const [orgFilter, setOrgFilter] =
    useState("");

  const [vanFilter, setVanFilter] =
    useState("");
const [isLoggedIn, setIsLoggedIn] = useState(false);

const [showLoginModal, setShowLoginModal] = useState(false);

const [username, setUsername] = useState("");

const [password, setPassword] = useState("");

  const loadUsers = async () => {

  const response =
    await fetch("/api/users");

  const data =
    await response.json();

  console.log(
    "LOADED USERS",
    data
  );

  setUsers(data || []);

};
useEffect(() => {
  const load = async () => {
    await loadUsers();

    const currentUser =
      await localStorage.getItem(
        "currentUser"
      );

    const role =
      await localStorage.getItem(
        "userRole"
      );

    if (role === "User") {
      window.location.href =
        "/mobile-summary";
      return;
    }

    if (currentUser) {
      setCurrentUser(currentUser);
    }

    setIsLoggedIn(!!currentUser);
  };

  load();
}, []);
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

// التحقق من الملف
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
    region:
      row["Region"] || "",
    city:
      row["City"] || "",
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

        await fetch(
          "/api/users",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              users: usersData,
              uploadedBy: currentUser,
            }),
          }
        );
let fullName = "";

if (currentUser) {
  const { data: user } = await supabase
    .from("app_users")
    .select("full_name")
    .eq("username", currentUser)
    .single();

  fullName = user?.full_name || "";
}

await addLog(
  currentUser || "",
  fullName,
  "IMPORT_USERS",
  file.name
);
        await loadUsers();

setIsImportingUsers(false);

      } finally {

        setIsImportingUsers(false);

      }

    };

    reader.readAsBinaryString(file);

  } catch {

    setIsImportingUsers(false);

  }
};

  const handleDelete =
  async (id: number) => {

    if (deletingUserId === id)
      return;

    setDeletingUserId(id);

    try {

      await fetch(
        "/api/users",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id,
          }),
        }
      );

      await loadUsers();

    } finally {

      setDeletingUserId(null);

    }
  };
  const handleEdit = (
  user: any
) => {

  if (editingUserId === user.id)
    return;

  setEditingUserId(user.id);

  setEditingId(user.id);

  setEditData(user);

};
const handleSave =
  async () => {

    if (saving) return;

    setSaving(true);

    try {

      await fetch(
        "/api/users",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            editData
          ),
        }
      );

      setEditingId(null);
      setEditingUserId(null);
      setEditData({});

      await loadUsers();

    } finally {

      setSaving(false);

    }
  };
    const filteredUsers =
    users.filter((user) => {

      const matchesSearch =
        JSON.stringify(user)
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesRegion =
        !regionFilter ||
        user.region === regionFilter;

      const matchesCity =
        !cityFilter ||
        user.city === cityFilter;

      const matchesOrg =
        !orgFilter ||
        user.organization_code ===
          orgFilter;

      const matchesVan =
        !vanFilter ||
        user.van_sub_inventory ===
          vanFilter;

      return (
        matchesSearch &&
        matchesRegion &&
        matchesCity &&
        matchesOrg &&
        matchesVan
      );
    });

return (
<>
  <div className="min-h-screen bg-[#f4f7fc] flex text-slate-900">

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
  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
>
  <Settings size={18} />
  <span>Settings</span>
</Link>

  <Link
    href="/users"
    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600"
  >
    <Users size={18} />
    <span>Users</span>
  </Link>

</nav>

      <div className="p-6 border-t border-white/10">

  {isLoggedIn ? (
<div
  className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg ${
    isLoggedIn ? "bg-red-600" : "bg-blue-600"
  }`}
  onClick={async () => {
  await localStorage.removeItem(
  "currentUser"
);

await localStorage.removeItem(
  "userRole"
);

setIsLoggedIn(false);
setUsername("");
setPassword("");
}}

>
  {isLoggedIn ? (
    <>
      <LogOut size={18} />
      Logout
    </>
  ) : (
    <>
      <Users size={18} />
      Login
    </>
  )}
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

      <div className="flex justify-between mb-6">

        <h1 className="text-3xl font-bold">
          Users
        </h1>

        {isLoggedIn && (
  <label
  className={`text-white px-4 py-2 rounded ${
    isImportingUsers
      ? "bg-slate-400 pointer-events-none"
      : "bg-blue-600 cursor-pointer"
  }`}
>
  {isImportingUsers
    ? "Importing..."
    : "Import Users"}
    <input
      type="file"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={handleImport}
    />
  </label>
)}

      </div>

      <div className="grid grid-cols-5 gap-3 mb-5">

        <input
          placeholder="Search"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="border rounded p-2"
        />

        <select
          value={regionFilter}
          onChange={(e) =>
            setRegionFilter(
              e.target.value
            )
          }
          className="border rounded p-2"
        >
          <option value="">
            Region
          </option>

          {[...new Set(
            users.map(
              (u) => u.region
            )
          )].map((item) => (
            <option
              key={String(item)}
              value={String(item)}
            >
              {String(item)}
            </option>
          ))}
        </select>

        <select
          value={cityFilter}
          onChange={(e) =>
            setCityFilter(
              e.target.value
            )
          }
          className="border rounded p-2"
        >
          <option value="">
            City
          </option>

          {[...new Set(
            users.map(
              (u) => u.city
            )
          )].map((item) => (
            <option
              key={String(item)}
              value={String(item)}
            >
              {String(item)}
            </option>
          ))}
        </select>

        <select
          value={orgFilter}
          onChange={(e) =>
            setOrgFilter(
              e.target.value
            )
          }
          className="border rounded p-2"
        >
          <option value="">
            Organization Code
          </option>

          {[...new Set(
            users.map(
              (u) =>
                u.organization_code
            )
          )].map((item) => (
            <option
              key={String(item)}
              value={String(item)}
            >
              {String(item)}
            </option>
          ))}
        </select>

        <select
          value={vanFilter}
          onChange={(e) =>
            setVanFilter(
              e.target.value
            )
          }
          className="border rounded p-2"
        >
          <option value="">
            Van Sub Inventory
          </option>

          {[...new Set(
            users.map(
              (u) =>
                u.van_sub_inventory
            )
          )].map((item) => (
            <option
              key={String(item)}
              value={String(item)}
            >
              {String(item)}
            </option>
          ))}
        </select>

      </div>

      <div className="overflow-auto">

        <table className="w-full border">

          <thead>

            <tr className="bg-slate-800 text-white">

              <th className="p-3">
                Region
              </th>

              <th className="p-3">
                City
              </th>

              <th className="p-3">
                Organization Code
              </th>

              <th className="p-3">
                User Code
              </th>

              <th className="p-3">
                Organization Name
              </th>

              <th className="p-3">
                Van Sub Inventory
              </th>

              <th className="p-3">
                Contact
              </th>

              <th className="p-3">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredUsers.map(
              (user) => (

              <tr
                key={user.id}
                className="border-b"
              >
                <td className="p-2">
  {editingId === user.id ? (
    <input
      value={editData.region || ""}
      onChange={(e) =>
        setEditData({
          ...editData,
          region: e.target.value,
        })
      }
      className="border p-1 w-full"
    />
  ) : (
    user.region
  )}
</td>

<td className="p-2">
  {editingId === user.id ? (
    <input
      value={editData.city || ""}
      onChange={(e) =>
        setEditData({
          ...editData,
          city: e.target.value,
        })
      }
      className="border p-1 w-full"
    />
  ) : (
    user.city
  )}
</td>

<td className="p-2">
  {editingId === user.id ? (
    <input
      value={editData.organization_code || ""}
      onChange={(e) =>
        setEditData({
          ...editData,
          organization_code:
            e.target.value,
        })
      }
      className="border p-1 w-full"
    />
  ) : (
    user.organization_code
  )}
</td>

<td className="p-2">
  {editingId === user.id ? (
    <input
      value={editData.user_code || ""}
      onChange={(e) =>
        setEditData({
          ...editData,
          user_code:
            e.target.value,
        })
      }
      className="border p-1 w-full"
    />
  ) : (
    user.user_code
  )}
</td>

<td className="p-2">
  {editingId === user.id ? (
    <input
      value={
        editData.organization_name ||
        ""
      }
      onChange={(e) =>
        setEditData({
          ...editData,
          organization_name:
            e.target.value,
        })
      }
      className="border p-1 w-full"
    />
  ) : (
    user.organization_name
  )}
</td>

<td className="p-2">
  {editingId === user.id ? (
    <input
      value={
        editData.van_sub_inventory ||
        ""
      }
      onChange={(e) =>
        setEditData({
          ...editData,
          van_sub_inventory:
            e.target.value,
        })
      }
      className="border p-1 w-full"
    />
  ) : (
    user.van_sub_inventory
  )}
</td>

<td className="p-2">
  {editingId === user.id ? (
    <input
      value={editData.contact || ""}
      onChange={(e) =>
        setEditData({
          ...editData,
          contact:
            e.target.value,
        })
      }
      className="border p-1 w-full"
    />
  ) : (
    user.contact
  )}
</td>

                <td className="p-2 flex gap-2">

                  {isLoggedIn &&
  (editingId === user.id ? (
<button
  disabled={saving}
  className={`text-white px-3 py-1 rounded ${
    saving
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-green-600"
  }`}
  onClick={handleSave}
>
  {saving ? "Saving..." : "Save"}
</button>
  ) : (
<button
  disabled={editingUserId === user.id}
  className={`text-white px-3 py-1 rounded ${
    editingUserId === user.id
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
  onClick={() => handleEdit(user)}
>
  {editingUserId === user.id
    ? "Editing..."
    : "Edit"}
</button>
  ))}

{isLoggedIn && (
<button
  disabled={deletingUserId === user.id}
  className={`text-white px-3 py-1 rounded ${
    deletingUserId === user.id
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-red-600"
  }`}
  onClick={() => handleDelete(user.id)}
>
  {deletingUserId === user.id
    ? "Deleting..."
    : "Delete"}
</button>
)}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>

  </div>

  {showLoginModal && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">

      <div className="bg-white w-[420px] rounded-2xl shadow-2xl p-8">

        <h2 className="text-3xl font-bold text-center mb-6">
          Login
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border p-3 rounded-xl mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

await localStorage.setItem(
  "userRole",
  user.role
);

setIsLoggedIn(true);
setCurrentUser(user.username);

setShowLoginModal(false);

setUsername("");
setPassword("");
          }}
        >
          Login
        </button>

        <button
          className="w-full mt-3 border py-3 rounded-xl"
          onClick={() => setShowLoginModal(false)}
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

</>
);
}