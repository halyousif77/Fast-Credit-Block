"use client";
import WhatsAppReport from "@/components/WhatsAppReport";
import html2canvas from "html2canvas";
import { FaWhatsapp } from "react-icons/fa";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { addLog } from "@/lib/activityLog";
import { storage as localStorage } from "@/utils/storage";
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
  Truck,
  CircleAlert,
  CheckCircle,
  Receipt,
      ClipboardList,
  PieChart,
} from "lucide-react";

import { useEffect, useState } from "react";

export default function SummaryPage() {
  const [whatsAppVan, setWhatsAppVan] =
  useState("");

const [isSendingWhatsApp,
  setIsSendingWhatsApp] =
  useState(false);
  const [creditRules, setCreditRules] =
  useState<any[]>([]);

  
const [isImportingUsers,
  setIsImportingUsers] =
  useState(false);

  const [showImportModal, setShowImportModal] =
  useState(false);
  const [isUploadingCredit,
  setIsUploadingCredit] =
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
  toast.error("Invalid Users File");
  setIsImportingUsers(false);
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
      .eq("username", currentUser)
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

  const [data, setData] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [collectedInvoices, setCollectedInvoices] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<any>({});
  const [filters, setFilters] = useState<any>({
  regions: [],
  cities: [],
  vans: [],
});
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
  toast.error("Invalid Credit File");
  setIsUploadingCredit(false);
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
      .eq("username", currentUser)
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

if (a1 !== "Collection Submit Time") {
  toast.error("Invalid Collection File");
  setIsUploadingCollection(false);
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
      .eq("username", currentUser)
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
  
const [isLoggedIn, setIsLoggedIn] = useState(false);

const [showLoginModal, setShowLoginModal] = useState(false);

const [username, setUsername] = useState("");

const [password, setPassword] = useState("");
const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {

  const loadData = async () => {

    const response = await fetch("/api/credit-data");
const result = await response.json();

setData(result.data || []);

const exceptionsResponse =
  await fetch("/api/exceptions");

const exceptionsData =
  await exceptionsResponse.json();

const today = new Date();
today.setHours(0,0,0,0);

const validExceptions =
  exceptionsData.filter((item:any) => {

    const tillDate =
      new Date(item.till_date);

    tillDate.setHours(
      0,0,0,0
    );

    return (
      item.permanent ||
      tillDate >= today
    );
  });

setExceptions(validExceptions);
const currentUser =
  await localStorage.getItem("currentUser");

const { data: appUser } =
  await supabase
    .from("app_users")
    .select("role")
    .eq("username", currentUser)
    .single();

if (
  appUser?.role === "user"
) {
  alert("You do not have permission to access this page");
  window.location.href = "/van";
  return;
}

    const filterKey =
  currentUser
    ? `savedFilters_${currentUser}`
    : "savedFilters_guest";

const savedFilters =
  await localStorage.getItem(
    filterKey
  );
  
    if (savedFilters) {
      setFilters(JSON.parse(savedFilters));
    }

    const collectionResponse =
  await fetch("/api/collection-data");

const collectionData =
  await collectionResponse.json();

setCollectedInvoices(
  collectionData.invoices || []
);

const { data: permissionData } =
  await supabase
    .from("van_permissions")
    .select("*");

const mappedPermissions:any = {};

(permissionData || []).forEach(
  (item:any) => {

    mappedPermissions[
      item.van_code
    ] = item.is_unblocked;

  }
);

setPermissions(
  mappedPermissions
);
    
    
    if (currentUser) {
  setCurrentUser(currentUser);
  setIsLoggedIn(true);
} else {
  setCurrentUser("");
  setIsLoggedIn(false);
}

  };

  loadData();

}, []);
useEffect(() => {

  const loadRules = async () => {

    const currentUser =
      await localStorage.getItem(
        "currentUser"
      );

    if (!currentUser) return;

    const { data } = await supabase
      .from("credit_block_rules")
      .select("*")
      .eq("username", currentUser);

    setCreditRules(data || []);

  };

  loadRules();

}, []);
  const getStatusStyle = (
  remaining: number,
  ex: number
) => {
  if (remaining === 0 && ex === 0) {
    return "bg-green-100 text-green-700";
  }

  if (remaining > 0 && ex === 0) {
    return "bg-pink-100 text-pink-700";
  }

  if (remaining === 0 && ex > 0) {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-orange-200 text-orange-900";
};
const filteredData = data.filter((row) => {

  const regionMatch =
  filters.regions.length === 0 ||
  filters.regions.includes(
    row["Region"]
  );
  const cityMatch =
    filters.cities.length === 0 ||
    filters.cities.includes(
      row["City"]
    );

  const vanMatch =
    filters.vans.length === 0 ||
    filters.vans.includes(
      row["Van Code."]
    );

  const isNotCentral =
    String(
      row["Central Invoice"] || ""
    )
      .trim()
      .toUpperCase() ===
    "NOT CENTRAL";

  const invoiceStatus = String(
    row["Invoice status (Due/ Overdue)"] || ""
  ).toLowerCase();

  const paymentTerm = String(
    row["Payment Term"] || ""
  ).trim();

  const normalize = (
    value: string
  ) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

  const rule = creditRules.find(
    r =>
      normalize(r.payment_term) ===
      normalize(paymentTerm)
  );

  const creditDays =
    Number(row["Credit_Days"]) || 0;

  const showInvoice =
  rule
    ? creditDays >= rule.block_at_day
    : creditDays >= 1;

  return (
    isNotCentral &&
    !invoiceStatus.includes("legal") &&
    showInvoice &&
    regionMatch &&
    cityMatch &&
    vanMatch
  );

});
  const vans = Object.entries(
  filteredData.reduce((acc: any, row) => {

    const van = row["Van Code."];

    if (!acc[van]) {
      acc[van] = {
        ids: new Set(),
        remaining: 0,
        exceptions: 0,
      };
    }

    acc[van].ids.add(
      row["Employee ATS Code."]
    );

    const invoice =
      String(row["Invoice #"])
        .replace(/\s/g, "")
        .toUpperCase();

    const isException =
      exceptions.some(
        (e: any) =>
          String(e.invoice)
            .replace(/\s/g, "")
            .toUpperCase() ===
          invoice
      );

    const isCollected =
      collectedInvoices.some(
        i =>
          String(i)
            .replace(/\s/g, "")
            .toUpperCase() ===
          invoice
      );

    if (isException) {

      acc[van].exceptions++;

    } else if (!isCollected) {

      acc[van].remaining++;

    }

    return acc;

  }, {})
)

.sort((a: any, b: any) => {

  const aVan = String(a[0]).trim();
  const bVan = String(b[0]).trim();

  const aIsHFR =
    aVan.includes("HFR");

  const bIsHFR =
    bVan.includes("HFR");

  // HFR دائماً في الأخير
  if (aIsHFR && !bIsHFR)
    return 1;

  if (!aIsHFR && bIsHFR)
    return -1;

  // ترتيب أبجدي/رقمي داخل كل مجموعة
  return aVan.localeCompare(
    bVan,
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );

});
  const getStatus = (
  remaining: number,
  ex: number
) => {

  if (
    remaining > 0 &&
    ex > 0
  ) {
    return `${remaining} Remaining , Ex`;
  }

  if (
    remaining > 0
  ) {
    return `${remaining} Remaining`;
  }

  if (
    remaining === 0 &&
    ex > 0
  ) {
    return "Ex & All Collected";
  }

  return "All Collected";

};
const regionSummaryData = data.filter((row) => {

  const isNotCentral =
    String(
      row["Central Invoice"] || ""
    )
      .trim()
      .toUpperCase() ===
    "NOT CENTRAL";

  const invoiceStatus = String(
    row["Invoice status (Due/ Overdue)"] || ""
  ).toLowerCase();

  const paymentTerm = String(
    row["Payment Term"] || ""
  ).trim();

  const normalize = (
    value: string
  ) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

  const rule = creditRules.find(
    r =>
      normalize(r.payment_term) ===
      normalize(paymentTerm)
  );

  const creditDays =
    Number(row["Credit_Days"]) || 0;

  const showInvoice =
  rule
    ? creditDays >= rule.block_at_day
    : creditDays >= 1;

  return (
    isNotCentral &&
    !invoiceStatus.includes("legal") &&
    showInvoice
  );

});
const regionSummary = Object.entries(

  regionSummaryData.reduce(
        (acc: any, row) => {

const region =
  row["Region"] || "Unknown";
      if (!acc[region]) {
        acc[region] = {
          invoices: 0,
          amount: 0,
        };
      }

      const normalizedInvoice = String(
        row["Invoice #"] || ""
      )
        .trim()
        .replace(/\s/g, "")
        .toUpperCase();

      const isException =
        exceptions.some(
          (e: any) =>
            String(e.invoice || "")
              .trim()
              .replace(/\s/g, "")
              .toUpperCase() === normalizedInvoice
        );

      const isCollected =
        collectedInvoices.some(
          (i: string) =>
            String(i || "")
              .trim()
              .replace(/\s/g, "")
              .toUpperCase() === normalizedInvoice
        );

      if (
        !isException &&
        !isCollected
      ) {
        acc[region].invoices++;

        acc[region].amount +=
          Number(
            row["Pending CIM"]
          ) || 0;
      }

      return acc;
    },
    {}
  )
);
const whatsappData =
  filteredData.filter(
    (row) => {

      if (
        row["Van Code."] !==
        whatsAppVan
      ) {
        return false;
      }

      const invoice =
        String(
          row["Invoice #"]
        )
          .replace(/\s/g, "")
          .toUpperCase();

      const isException =
        exceptions.some(
          (e) =>
            String(e.invoice)
              .replace(/\s/g, "")
              .toUpperCase() ===
            invoice
        );

      const isCollected =
        collectedInvoices.some(
          (i) =>
            String(i)
              .replace(/\s/g, "")
              .toUpperCase() ===
            invoice
        );

      return (
        !isException &&
        !isCollected
      );

    }
  );
const sendWhatsApp = async (
  vanCode: string
) => {

  if (isSendingWhatsApp)
    return;

  setIsSendingWhatsApp(true);

  try {

    setWhatsAppVan(vanCode);

    await new Promise(
      resolve =>
        setTimeout(resolve, 200)
    );

    const report =
      document.getElementById(
        "whatsapp-report"
      );

    if (!report) {

      alert(
        "Report Not Found"
      );

      return;

    }

    const canvas =
      await html2canvas(
        report,
        {
          scale: 2,
          backgroundColor:
            "#ffffff",
        }
      );

    const blob =
      await new Promise<
        Blob | null
      >(
        resolve =>
          canvas.toBlob(
            blob =>
              resolve(blob),
            "image/png"
          )
      );

    if (!blob) return;

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);

    const response =
      await fetch("/api/users");

    const users =
      await response.json();

    const selectedUser =
      users.find(
        (user: any) =>
          user.van_sub_inventory ===
          vanCode
      );

    if (!selectedUser) {

      alert(
        `Van ${vanCode} not found`
      );

      return;

    }

    const phoneNumber =
      String(
        selectedUser.contact
      ).replace(/\s/g, "");

    const whatsappNumber =
      phoneNumber.startsWith(
        "05"
      )
        ? `966${phoneNumber.slice(1)}`
        : phoneNumber;

    window.open(
      `https://wa.me/${whatsappNumber}`,
      "_blank"
    );

  } finally {

    setIsSendingWhatsApp(false);

  }

};
  return (
  <>
    <div
      style={{
        position: "absolute",
        left: "-99999px",
        top: 0,
      }}
    >
      <WhatsAppReport
        vanCode={whatsAppVan}
        data={whatsappData}
      />
    </div>

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
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"
  >
    <AlertCircle size={18} />
    <span>Exceptions</span>
  </Link>

  <Link
    href="/summary"
    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600"
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

  await localStorage.removeItem("currentUser");

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

        <h1 className="text-3xl font-bold mb-6">
          Summary
        </h1>
<div className="grid grid-cols-4 gap-4 mb-6">


  <div className="bg-white border rounded-xl p-5 shadow-sm">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-slate-500">
          Total Vans
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {vans.length}
        </h2>
      </div>

      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
        <Truck
          size={22}
          className="text-blue-600"
        />
      </div>

    </div>

  </div>

  <div className="bg-white border rounded-xl p-5 shadow-sm">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-pink-600">
          Remaining Invoices
        </p>

        <h2 className="text-3xl font-bold mt-2 text-pink-600">
          {vans.reduce(
            (
              sum: number,
              [_, info]: any
            ) =>
              sum +
              info.remaining,
            0
          )}
        </h2>
      </div>

      <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
        <Receipt
          size={22}
          className="text-pink-600"
        />
      </div>

    </div>

  </div>

  <div className="bg-white border rounded-xl p-5 shadow-sm">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-orange-600">
          Exception Invoices
        </p>

        <h2 className="text-3xl font-bold mt-2 text-orange-600">
          {vans.reduce(
            (
              sum: number,
              [_, info]: any
            ) =>
              sum +
              info.exceptions,
            0
          )}
        </h2>
      </div>

      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
        <CircleAlert
          size={22}
          className="text-orange-600"
        />
      </div>

    </div>

  </div>

  <div className="bg-white border rounded-xl p-5 shadow-sm">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-green-600">
          All Collected Vans
        </p>

        <h2 className="text-3xl font-bold mt-2 text-green-600">
          {
            vans.filter(
              ([_, info]: any) =>
                info.remaining === 0
            ).length
          }
        </h2>
      </div>

      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle
          size={22}
          className="text-green-600"
        />
      </div>

    </div>

  </div>

</div>

<div className="flex gap-6 items-stretch">

<div
  className="
    flex-1
    bg-white
    rounded-2xl
    shadow-sm
    border
    border-slate-100
    overflow-hidden
  "
>

  <div className="px-6 py-5 border-b border-slate-100">

    <div className="flex items-center justify-between">

      <div>

        <h2 className="text-xl font-bold text-slate-800">
          Van Performance
        </h2>

       <p className="text-xs text-slate-500 mt-1">
          Credit block status by van
        </p>

      </div>

      <div className="text-sm text-slate-500">
        {vans.length} Vans
      </div>

    </div>

  </div>

  <div className="overflow-auto max-h-[500px]">

    <table className="w-full text-sm border-collapse">
  <thead className="sticky top-0 z-10 bg-[#071d5c] text-white">

<tr className="bg-[#071d5c] text-white border-b border-blue-900">

<th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-900">
  Status
</th>

<th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-900">
  ID
</th>

<th className="px-4 py-3 text-center text-sm font-semibold border-r border-blue-900">
  Van Code
</th>

<th className="px-4 py-3 text-center text-sm font-semibold">
  Permission
</th>

</tr>

</thead>

  <tbody>

    {vans
            .map(([van, info]: any) => {

        const status =
          getStatus(
            info.remaining,
            info.exceptions
          );

        return (

      <tr
  key={van}
  className={`
  transition-all
  duration-200
  ${
  permissions[van]
    ? "bg-green-100"
    : status === "All Collected" ||
      status === "Ex & All Collected"
    ? "bg-yellow-50"
    : "hover:bg-slate-50"
}
`}
  >

            <td className="px-4 py-3 text-center border-r border-b border-slate-300">

  <div className="flex items-center justify-center gap-2">

  <div className="w-[24px] flex justify-center">

    {info.remaining > 0 && (

      <button
        onClick={() => sendWhatsApp(van)}
        className="
          text-green-600
          hover:text-green-700
          transition
        "
        title="Send WhatsApp Report"
      >
        <FaWhatsapp size={22} />
      </button>

    )}

  </div>

  <span
    className={`
  inline-flex
  items-center
  justify-center
  min-w-[130px]
  px-3
  py-1
  rounded-full
  text-xs
  font-semibold
  border border-black/10
  ${getStatusStyle(
    info.remaining,
    info.exceptions
  )}
`}
  >
    {status}
  </span>

  </div>

</td>
            <td className="px-3 py-2 border-r border-b border-slate-300 text-center">
              {[...info.ids].join(" or ")}
            </td>

            <td className="px-3 py-2 text-center border-r border-b border-slate-300 font-semibold text-slate-800">
  {van}
</td>

<td className="px-4 py-3 text-center border-b border-slate-300">
    <input
    type="checkbox"
    className="w-4 h-4 accent-blue-600 cursor-pointer"
    disabled={!isLoggedIn}
    checked={
      permissions[van] ?? false
    }
    onChange={async (e) => {

  const isChecked = e.target.checked;

  setPermissions((prev: any) => ({
  ...prev,
  [van]: isChecked,
}));
  await supabase
    .from("van_permissions")
    .upsert(
      {
        van_code: van,
        is_unblocked: isChecked,
      },
      {
        onConflict: "van_code",
      }
    );

  if (isChecked) {



  try {

    const response =
      await fetch("/api/send-push", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          van_code: van,
        }),
      });


  } catch (error) {

    

  }

}
}}
  />
</td>
          </tr>

        );

      })}

  </tbody>

</table>

</div>

</div>

<div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">    <div className="px-5 py-4 border-b border-slate-100">

    <h2 className="text-lg font-bold text-slate-800">
      Region Summary
    </h2>

    <p className="text-xs text-slate-500 mt-1">
      Outstanding invoices by region
    </p>

  </div>

  <div className="p-6 flex-1">

    <div className="space-y-5">

      {regionSummary
        .sort(
          (a: any, b: any) =>
            b[1].invoices -
            a[1].invoices
        )
        .map(
          ([region, info]: any) => {

            const maxInvoices =
              Math.max(
                ...regionSummary.map(
                  (r: any) =>
                    r[1].invoices
                ),
                1
              );

            return (

              <div key={region}>

                <div className="flex justify-between mb-2">

                  <span className="font-semibold">
                    {region}
                  </span>

                  <span className="text-slate-500">
                    {info.invoices}
                    {" "}
                    Invoices
                  </span>

                </div>

                <div className="h-3 bg-slate-200 rounded-full">

                  <div
                    className="h-3 bg-blue-600 rounded-full"
                    style={{
                      width: `${
                        (
                          info.invoices /
                          maxInvoices
                        ) * 100
                      }%`,
                    }}
                  />

                </div>

                <div className="text-right text-sm text-slate-500 mt-1">

                  SAR {info.amount.toLocaleString()}
                </div>

              </div>

            );

          }
        )}

    </div>

</div>

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
        className="w-full border p-3 rounded-xl mb-4"
                placeholder="Username"
        value={username}
        onChange={(e) =>
          setUsername(e.target.value)
        }
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

setCurrentUser(data.username);

setIsLoggedIn(true);

await addLog(
  data.username,
  data.full_name,
  "LOGIN",
  "User logged in"
);

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
  </>
);
}
