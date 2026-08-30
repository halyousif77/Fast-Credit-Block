"use client";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { storage as localStorage } from "@/utils/storage";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { addLog } from "@/lib/activityLog";
import {
  Activity,
  Upload,
  FileText,
  AlertCircle,
  BarChart3,
  Settings,
  Users,
  LogOut,
  LayoutDashboard,
     ClipboardList,
  PieChart,
} from "lucide-react";


export default function LogsPage() {
  const [selectedDate, setSelectedDate] = useState(
  new Date().toISOString().split("T")[0]
);
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
const [password, setPassword] = useState("");
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [showLoginModal, setShowLoginModal] = useState(false);
const [currentUser, setCurrentUser] = useState("");
const [currentFullName, setCurrentFullName] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
useEffect(() => {

  const loadUser = async () => {

    const savedUser =
      await localStorage.getItem(
        "currentUser"
      );

    if (savedUser) {

  setCurrentUser(savedUser);

  const { data: user } = await supabase
    .from("app_users")
    .select("full_name")
    .eq("username", savedUser)
    .single();

  if (user) {
    setCurrentFullName(user.full_name);
  }

  setIsLoggedIn(true);

}
  };

  loadUser();

}, []);
  useEffect(() => {

    const loadLogs = async () => {

  const firstDayOfMonth =
    new Date();

  firstDayOfMonth.setDate(1);

  firstDayOfMonth.setHours(
    0,
    0,
    0,
    0
  );

  await supabase
    .from("activity_logs")
    .delete()
    .lt(
      "created_at",
      firstDayOfMonth.toISOString()
    );

  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  setLogs(data || []);


    };

    loadLogs();

  }, []);

  const filteredLogs = useMemo(() => {
  return logs.filter((log) => {
    const userMatch =
      !selectedUser ||
      log.full_name === selectedUser;

    const actionMatch =
      !selectedAction ||
      log.action === selectedAction;

    const dateMatch =
      !selectedDate ||
      new Date(log.created_at)
        .toISOString()
        .split("T")[0] === selectedDate;

    return (
      userMatch &&
      actionMatch &&
      dateMatch
    );
  });
}, [
  logs,
  selectedUser,
  selectedAction,
  selectedDate,
]);
  const todayActivities =
  filteredLogs.filter(log => {

    const today =
      new Date().toDateString();

    return (
      new Date(
        log.created_at
      ).toDateString() === today
    );

  }).length;
  const uniqueUsers =
  new Set(
    filteredLogs.map(
      log => log.username
    )
  ).size;
  const importCount =
  filteredLogs.filter(
    log =>
      log.action ===
        "IMPORT_CREDIT" ||
      log.action ===
        "IMPORT_COLLECTION"
  ).length;
    const getActionBadge = (
    action: string
  ) => {

    switch (action) {

      case "IMPORT_CREDIT":

        return (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
            IMPORT CREDIT
          </span>
        );

      case "IMPORT_COLLECTION":

        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
            IMPORT COLLECTION
          </span>
        );

      case "ADD_EXCEPTION":

        return (
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
            ADD EXCEPTION
          </span>
        );

      case "DELETE_EXCEPTION":

        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
            DELETE EXCEPTION
          </span>
        );

      case "LOGIN":

        return (
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
            LOGIN
          </span>
        );

      case "LOGOUT":

        return (
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
            LOGOUT
          </span>
        );

      default:

        return (
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
            {action}
          </span>
        );

    }

  };

  const users = [
    ...new Set(
      logs.map(log => log.full_name)
    ),
  ];

  const actions = [
    ...new Set(
      logs.map(log => log.action)
    ),
  ];

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
    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600">
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
      onClick={async () => {

        await addLog(
          currentUser,
          currentFullName,
          "LOGOUT",
          "User logged out"
        );

        localStorage.removeItem(
          "currentUser"
        );

        setCurrentUser("");
        setCurrentFullName("");
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

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">

        <h1 className="text-3xl font-bold text-[#071d5c] flex items-center gap-2">
          <Activity size={28} />
          Activity Logs
        </h1>

        <p className="text-slate-500 mt-2">
          Complete audit history of user actions inside the system.
        </p>

      </div>

      <div className="grid grid-cols-4 gap-5 mb-6">

        <div className="bg-white border rounded-xl p-5">

          <div className="text-slate-500">
            Total Activities
          </div>

          <div className="text-4xl font-bold mt-3 text-[#071d5c]">
            {filteredLogs.length}
          </div>

        </div>

        <div className="bg-white border rounded-xl p-5">

          <div className="text-slate-500">
            Today
          </div>

          <div className="text-4xl font-bold mt-3 text-green-600">
            {todayActivities}
          </div>

        </div>

        <div className="bg-white border rounded-xl p-5">

          <div className="text-slate-500">
            Users
          </div>

          <div className="text-4xl font-bold mt-3 text-purple-600">
            {uniqueUsers}
          </div>

        </div>

        <div className="bg-white border rounded-xl p-5">

          <div className="text-slate-500">
            Imports
          </div>

          <div className="text-4xl font-bold mt-3 text-blue-600">
            {importCount}
          </div>

        </div>

      </div>

      <div className="bg-white rounded-xl border p-5 mb-6">

  <div className="flex gap-3 flex-wrap">

    <select
      value={selectedUser}
      onChange={(e) =>
        setSelectedUser(
          e.target.value
        )
      }
      className="border rounded-lg px-4 py-2"
    >
      <option value="">
        All Users
      </option>

      {users.map(user => (

        <option
          key={user}
          value={user}
        >
          {user}
        </option>

      ))}

    </select>

    <select
      value={selectedAction}
      onChange={(e) =>
        setSelectedAction(
          e.target.value
        )
      }
      className="border rounded-lg px-4 py-2"
    >
      <option value="">
        All Actions
      </option>

      {actions.map(action => (

        <option
          key={action}
          value={action}
        >
          {action}
        </option>

      ))}

    </select>

    <input
      type="date"
      value={selectedDate}
      onChange={(e) =>
        setSelectedDate(
          e.target.value
        )
      }
      className="border rounded-lg px-4 py-2"
    />

    <button
      onClick={() => {
        setSelectedUser("");
        setSelectedAction("");
        setSelectedDate("");
      }}
      className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
    >
      Reset
    </button>

  </div>


      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

        <table className="w-full text-sm">

          <thead>

            <tr className="bg-[#0b2668] text-white">

              <th className="p-4 text-left">
                Date & Time
              </th>

              <th className="p-4 text-left">
                User
              </th>

              <th className="p-4 text-left">
                Action
              </th>

              <th className="p-4 text-left">
                Details
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredLogs.map(log => (

              <tr
                key={log.id}
                className="border-b hover:bg-slate-50"
              >

                <td className="p-4">

                  {new Date(
                    log.created_at
                  ).toLocaleString()}

                </td>

                <td className="p-4 font-medium">
                  {log.full_name}
                </td>

                <td className="p-4">
                  {getActionBadge(
                    log.action
                  )}
                </td>

                <td className="p-4">
                  {log.details}
                </td>

              </tr>

            ))}

            {filteredLogs.length === 0 && (

              <tr>

                <td
                  colSpan={4}
                  className="p-8 text-center text-slate-500"
                >
                  No logs found
                </td>

              </tr>

            )}

          </tbody>

        </table>

            </div>

    </main>

  </div>
  {showLoginModal && (

  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">

    <div className="bg-white w-[420px] rounded-2xl shadow-2xl p-8">

      <div className="text-center mb-6">

        <h2 className="text-3xl font-bold text-slate-800">
          Welcome Back
        </h2>

        <p className="text-slate-500 mt-2">
          Sign in to access management features
        </p>

      </div>

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

          setCurrentUser(user.username);
          setCurrentFullName(user.full_name);

          setIsLoggedIn(true);

          await addLog(
            user.username,
            user.full_name,
            "LOGIN",
            "User logged in"
          );

          await localStorage.setItem(
            "currentUser",
            user.username
          );

          setShowLoginModal(false);

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