
"use client";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { addLog } from "@/lib/activityLog";
import { supabase } from "@/lib/supabase";
import { storage as localStorage } from "@/utils/storage";
import { useEffect, useState } from "react";
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


export default function ExceptionsPage() {
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


    const currentUser =
  await localStorage.getItem(
    "currentUser"
  );

const formData =
  new FormData();

formData.append(
  "file",
  file
);

formData.append(
  "uploadedBy",
  currentUser || ""
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

    toast.success("Import Completed");

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
  const [searchTerm, setSearchTerm] =
  useState("");
    const [deletingId, setDeletingId] =
  useState<number | null>(null);
  const [isAddingExceptions, setIsAddingExceptions] =
  useState(false);
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
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [invoiceText, setInvoiceText] = useState("");

const [tillDate, setTillDate] = useState("");
const [isPermanent, setIsPermanent] =
  useState(false);
  const [hasAccess, setHasAccess] =
  useState(true);

useEffect(() => {
  const checkAccess = async () => {
    const role =
      await localStorage.getItem(
        "userRole"
      );

    if (role === "User") {
      setHasAccess(false);
    }
  };

  checkAccess();
}, []);

useEffect(() => {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const invoice =
    params.get("invoice");

  if (invoice) {
    setSearchTerm(invoice);
  }

}, []);


const addedCount =
  exceptions.filter(
    item => !item.permanent
  ).length;

const legalCount =
  exceptions.filter(
    item => item.permanent
  ).length;

useEffect(() => {

  const loadExceptions = async () => {

    const response =
      await fetch("/api/exceptions");

    const data =
      await response.json();
    setExceptions(data || []);

  };

  loadExceptions();

}, []);
useEffect(() => {
  const loadGuestFilter = async () => {
    const currentUser = await localStorage.getItem("currentUser");

    if (!currentUser) {
      const savedFilter = await localStorage.getItem(
        "guest_exceptions_filter"
      );

      if (savedFilter) {
        setSearchTerm(savedFilter);
      }
    }
  };

  loadGuestFilter();
}, []);
useEffect(() => {
  const saveGuestFilter = async () => {
    const currentUser = await localStorage.getItem("currentUser");

    if (!currentUser) {
      await localStorage.setItem(
        "guest_exceptions_filter",
        searchTerm
      );
    }
  };

  saveGuestFilter();
}, [searchTerm]);
useEffect(() => {

  const loadUser = async () => {

    const savedUser =
      await localStorage.getItem(
        "currentUser"
      );
    if (savedUser) {

      setCurrentUser(savedUser);

      setIsLoggedIn(true);

    }

  };

  loadUser();

}, []);
useEffect(() => {
  const removeDuplicates = async () => {
    const duplicatesToDelete: number[] = [];

    const grouped = exceptions.reduce((acc: any, item: any) => {
      const key = item.invoice;

      if (!acc[key]) {
        acc[key] = [item];
      } else {
        acc[key].push(item);
      }

      return acc;
    }, {});

    Object.values(grouped).forEach((items: any) => {
      if (items.length > 1) {
        items.sort(
          (a: any, b: any) =>
            calculateBusinessDays(b.till_date) -
            calculateBusinessDays(a.till_date)
        );

        items.slice(1).forEach((x: any) => {
          duplicatesToDelete.push(x.id);
        });
      }
    });

    if (duplicatesToDelete.length) {
  await supabase
    .from("exceptions")
    .delete()
    .in("id", duplicatesToDelete);

  setExceptions(prev =>
    prev.filter(
      item => !duplicatesToDelete.includes(item.id)
    )
  );
}  };

  if (exceptions.length) {
    removeDuplicates();
  }
}, [exceptions]);
const handleDateChange = (
  value: string
) => {

  const selectedDate =
    new Date(value);

  if (
    selectedDate.getDay() === 5
  ) {

    selectedDate.setDate(
      selectedDate.getDate() + 1
    );

    setTillDate(
      selectedDate
        .toISOString()
        .split("T")[0]
    );

    return;

  }

  setTillDate(value);

};
const calculateBusinessDays = (
  dateString: string
) => {

  if (!dateString) return 0;

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const endDate =
    new Date(dateString);

  let count = 0;

  const current =
    new Date(today);

  while (
    current <= endDate
  ) {

    if (
      current.getDay() !== 5
    ) {
      count++;
    }

    current.setDate(
      current.getDate() + 1
    );

  }

  return count;

};
const uniqueExceptions: any[] = Object.values(
  exceptions.reduce((acc: any, item: any) => {
    const key = item.invoice;

    const currentDays = item.permanent
      ? Number.MAX_SAFE_INTEGER
      : calculateBusinessDays(item.till_date);

    if (!acc[key]) {
      acc[key] = item;
    } else {
      const existingDays = acc[key].permanent
        ? Number.MAX_SAFE_INTEGER
        : calculateBusinessDays(acc[key].till_date);

      if (currentDays > existingDays) {
        acc[key] = item;
      }
    }

    return acc;
  }, {})
);
if (!hasAccess) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-2xl font-bold text-red-600">
        You Dont Have Permission To Enter This Page
      </h1>
    </div>
  );
}
return (
  <div className="min-h-screen bg-[#f4f7fc] flex">

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
    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600"
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

  const { data: user } = await supabase
    .from("app_users")
    .select("full_name")
    .eq("username", currentUser)
    .single();

  await addLog(
    currentUser,
    user?.full_name || currentUser,
    "LOGOUT",
    "User logged out"
  );

  await localStorage.removeItem(
  "currentUser"
);

await localStorage.removeItem(
  "userRole"
);

setCurrentUser("");
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

      <div className="bg-white rounded-xl border p-5 mb-6">
        <h1 className="text-3xl font-bold">
          Exceptions Management
        </h1>
      </div>

{isLoggedIn && (

  <div className="grid grid-cols-2 gap-6 mb-6">

    {/* Add Multiple Exceptions */}

    <div className="bg-white rounded-xl border shadow-sm p-5">

   
    <h3 className="font-bold text-lg mb-4">
      Add Multiple Exceptions
    </h3>

    <textarea
      rows={5}
      value={invoiceText}
      onChange={(e) =>
        setInvoiceText(e.target.value)
      }
      placeholder={`P1316600015510
P1316600015511
P1316600015512`}
      className="w-full border rounded-lg p-3 mb-4"
    />

    <label className="flex items-center gap-2 mb-4">
      <input
        type="checkbox"
        checked={isPermanent}
        onChange={(e) =>
          setIsPermanent(e.target.checked)
        }
      />
      Legal
    </label>

{!isPermanent && (

  <>

    <input
      type="date"
      value={tillDate}
      min={new Date().toISOString().split("T")[0]}
      onChange={(e) =>
        handleDateChange(
          e.target.value
        )
      }
      className="border rounded-lg p-3 mb-4 w-full"
    />

    {tillDate && (

      <div className="mb-4 text-sm text-green-600 font-semibold">

        Exception Duration:

        <span className="ml-2">

          {calculateBusinessDays(
            tillDate
          )}

          {" "}
          Working Days

        </span>

      </div>

    )}

  </>

)}

    {/* Add Exceptions Button هنا */}



<button
  disabled={isAddingExceptions}
  className={`text-white px-6 py-3 rounded-lg ${
    isAddingExceptions
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-700"
  }`}
  onClick={async () => {

  
    if (isAddingExceptions)
      return;

    setIsAddingExceptions(true);

    try {

      
      const currentUser =
  await localStorage.getItem(
    "currentUser"
  );

      if (!currentUser) {

        alert(
          "Please Login First"
        );

        return;

      }

      if (!invoiceText.trim()) {

        alert(
          "Please Enter Invoice Number"
        );

        return;

      }

      if (
        !isPermanent &&
        !tillDate
      ) {

        alert(
          "Please Select Till Date"
        );

        return;

      }

      const creditResponse =
        await fetch(
          "/api/credit-data"
        );
      const creditResult =
        await creditResponse.json();

      const creditData =
        creditResult.data || [];

      const invoices =
        invoiceText
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean);

      const newExceptions =
        invoices.map(invoice => {

         const match =
  creditData.find(
    (row: any) =>
      String(
        row["Invoice #"] || ""
      )
        .replace(/\s/g, "")
        .toUpperCase() ===
      invoice
        .replace(/\s/g, "")
        .toUpperCase()
  );

return {
  invoice,
  tillDate,
  vanCode:
    match?.["Van Code."] || "",
  employeeName:
    match?.["Employee Name."] || "",
  atsCode:
    match?.["Employee ATS Code."] || "",
  customerCode:
    match?.["Customer Code"] || "",
  customerName:
    match?.["Customer Name"] || "",
};
        });

     const { data: user } = await supabase
  .from("app_users")
  .select("full_name")
  .eq("username", currentUser)
  .single();

const saveResponse =
  await fetch(
    "/api/exceptions",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(
        newExceptions.map(
          item => ({
            invoice: item.invoice,
            till_date: isPermanent
              ? null
              : item.tillDate,
            permanent: isPermanent,
            van_code: item.vanCode,
            employee_name:
              item.employeeName,
            ats_code:
              item.atsCode,
            customer_code:
              item.customerCode,
            customer_name:
              item.customerName,
            created_by: currentUser,
          })
        )
      ),
    }
  );

if (!saveResponse.ok) {

  alert(
    "Failed To Save Exception"
  );

  return;
}

for (const item of newExceptions) {

  if (!item.vanCode) continue;

  const { count } = await supabase
    .from("exceptions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "van_code",
      item.vanCode
    );

  await fetch(
    "/api/send-exception-notification",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
  van_code: item.vanCode,
  count: count || 0,
  invoice: item.invoice,
  customer_code: item.customerCode,
  customer_name: item.customerName,
  days:
    isPermanent
      ? "Legal"
      : calculateBusinessDays(item.tillDate),
}),
    }
  );
}

await addLog(
  currentUser,
  user?.full_name || currentUser,
  "ADD_EXCEPTION",
  invoices.join(", ")
);

await supabase
  .from("notifications")
  .insert({
    username: null,
    title: "⚠️ Exceptions Added",
    message: `${user?.full_name || currentUser} added ${invoices.length} exception invoice(s).`,
  });
      const response =
        await fetch(
          "/api/exceptions"
        );

      const data =
        await response.json();

      setExceptions(data);

      setInvoiceText("");
      setTillDate("");


    } catch (error) {

      console.error(error);

      alert(
        "Unexpected Error"
      );

    } finally {

      setIsAddingExceptions(
        false
      );

    }

  }}
>
  
  {isAddingExceptions
    ? "Processing..."
    : "Add Exceptions"}
</button>
      </div>
      <div className="bg-white rounded-xl border shadow-sm p-5">

  <div className="flex justify-between items-center mb-6">

    <h3 className="font-bold text-lg">
      Recent Activity
    </h3>

    <span className="text-xs text-slate-400">
      Last Actions
    </span>

  </div>

  <div className="space-y-4">

  <div className="border border-green-200 bg-green-50 rounded-xl p-4">

    <div className="text-green-700 font-semibold">
      Added Exceptions
    </div>

    <div className="text-3xl font-bold mt-2">
      {addedCount}
    </div>

    <div className="text-sm text-slate-500">
      Total Records    </div>

  </div>

  <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">

    <div className="text-amber-700 font-semibold">
      Legal Exceptions
    </div>

    <div className="text-3xl font-bold mt-2">
      {legalCount}
    </div>

    <div className="text-sm text-slate-500">
      Total Records
    </div>

  </div>

</div>
</div>
</div>

)}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex justify-between items-center mb-4">

  <div className="flex justify-between items-center mb-4">

  <h3 className="font-bold text-xl">
    Current Exceptions
  </h3>

  <input
    type="text"
    placeholder="Search..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="border rounded-lg px-4 py-2 w-72"
  />

</div>
  <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold">
    Total: {exceptions.length}
  </div>

</div>
        <div className="overflow-x-auto">
  <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#071d5c] text-white">
              <th className="p-3 text-left">Van Code</th>
              <th className="p-3 text-left">Employee Name</th>
              <th className="p-3 text-left">ATS Code</th>
              <th className="p-3 text-left">Customer Code</th>
              <th className="p-3 text-left">Customer Name</th>
              <th className="p-3 text-left">Invoice #</th>
              <th className="p-3 text-left">Till Date</th>
              <th className="p-3 text-left">Days</th>
{isLoggedIn && (
  <th className="p-3 text-left">Delete</th>
)}

            </tr>
          </thead>

<tbody>

  {uniqueExceptions
  .filter(item => {
    const search = searchTerm.toLowerCase();

    return Object.values(item)
      .join(" ")
      .toLowerCase()
      .includes(search);
  })
  .map((item, index) => {

  const daysLeft =
    calculateBusinessDays(
      item.till_date
    );

  return (
    <tr
      key={index}
      className={`border-b ${
        item.permanent
          ? "bg-red-50"
          : "hover:bg-slate-50"
      }`}
    >

          
          <td className="p-3">{item.van_code}</td>

          <td className="p-3">
            {item.employee_name}
          </td>

          <td className="p-3">{item.ats_code}
</td>

          <td className="p-3">
            {item.customer_code}
          </td>

          <td className="p-3">
            {item.customer_name}
          </td>

          <td className="p-3">
            {item.invoice}
          </td>

          <td className="p-3">
            {item.till_date}
          </td>

          <td className="p-3">
  {item.permanent ? (
    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
      Legal
    </span>
  ) : (
    daysLeft
  )}
</td>
<td className="p-3">
  {isLoggedIn &&
    currentUser === item.created_by && (
      <button
  disabled={deletingId === item.id}
  className={`text-white px-3 py-1 rounded text-xs ${
    deletingId === item.id
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-red-600 hover:bg-red-700"
  }`}
  onClick={async () => {

    if (deletingId === item.id)
      return;

    setDeletingId(item.id);

    try {
await supabase
  .from("exceptions")
  .delete()
  .eq("invoice", item.invoice);
const { data: userInfo } = await supabase
  .from("app_users")
  .select("full_name")
  .eq("username", currentUser)
  .single();

await addLog(
  currentUser,
  userInfo?.full_name || currentUser,
  "DELETE_EXCEPTION",
  item.invoice
);
      setExceptions(prev =>
  prev.filter(
    exception => exception.invoice !== item.invoice
  )
);
      const { data: settings } = await supabase
  .from("user_settings")
  .select("exception_delete_alert")
  .eq("username", currentUser)
  .single();

if (settings?.exception_delete_alert) {

const { data: user } = await supabase
  .from("app_users")
  .select("full_name")
  .eq("username", currentUser)
  .single();

await supabase
  .from("notifications")
  .insert({
    username: null,
    title: "🗑️ Exception Deleted",
    message: `${user?.full_name || currentUser} removed invoice ${item.invoice}.`,
  });

}
    } finally {

      setDeletingId(null);

    }

  }}
>
  {deletingId === item.id
    ? "Deleting..."
    : "Delete"}
</button>
    )}
</td>
</tr>
);
})}


</tbody>
        </table>
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

  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !data) {
    alert("Invalid Username or Password");
    return;
  }

  await localStorage.setItem(
  "currentUser",
  data.username
);

await localStorage.setItem(
  "userRole",
  data.role
);
  setCurrentUser(data.username);

  setIsLoggedIn(true);
await addLog(
  data.username,
  data.full_name,
  "LOGIN",
  "User logged in"
);
  setShowLoginModal(false);

}}            >
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