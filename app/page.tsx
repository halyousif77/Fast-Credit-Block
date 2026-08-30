"use client";

import {
  ShieldX,
  ShieldCheck,
  FileWarning,
} from "lucide-react";
import { useMemo } from "react";
import { addLog } from "@/lib/activityLog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { storage as localStorage } from "@/utils/storage";
import WhatsAppReport from "@/components/WhatsAppReport";
import html2canvas from "html2canvas";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import {
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";
import {
  LayoutDashboard,
  Upload,
  AlertCircle,
  BarChart3,
  Settings,
  Users,
  LogOut,
  Search,
  Filter,
  ClipboardList,
  PieChart,
} from "lucide-react";

export default function Home() {
    const handleDateChange = (value: string) => {
  const selectedDate = new Date(value);

  if (selectedDate.getDay() === 5) {
    selectedDate.setDate(selectedDate.getDate() + 1);

    setTillDate(
      selectedDate.toISOString().split("T")[0]
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

  today.setHours(0, 0, 0, 0);

  const endDate = new Date(dateString);

  let count = 0;

  const current = new Date(today);

  while (current <= endDate) {
    if (current.getDay() !== 5) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};
  const [creditRules, setCreditRules] =
  useState<any[]>([]);
  const [isImportingUsers, setIsImportingUsers] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  
  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isImportingUsers) return;

    setIsImportingUsers(true);

    try {
      const file = event.target.files?.[0];

      if (!file) {
        setIsImportingUsers(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, {
            type: "binary",
          });

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

          const usersData = rows.map((row) => ({
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
  `${usersData.length} users`
);

setShowImportModal(false);

window.location.reload();
        } catch (error) {
          console.error(error);
          toast.error("Failed to import users");
        } finally {
  setIsImportingUsers(false);
}
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error(error);
      setIsImportingUsers(false);
      toast.error("Failed to import users");
    }
  };

   const [isSendingWhatsApp, setIsSendingWhatsApp] =
  useState(false);
  const [deletingExceptionId, setDeletingExceptionId] =
  useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState("");
  const [currentFullName, setCurrentFullName] = useState("");
const [whatsAppVan, setWhatsAppVan] =
  useState("");
  const [data, setData] =
    useState<any[]>([]);
    const [selectedRegions,
  setSelectedRegions] =
  useState<string[]>([]);

const [selectedCities,
  setSelectedCities] =
  useState<string[]>([]);

const [selectedVans,
  setSelectedVans] =
  useState<string[]>([]);

const [searchText, setSearchText] =
  useState("");
  
const [isLoggedIn,
  setIsLoggedIn] =
  useState(false);
const [showLoginModal, setShowLoginModal] = useState(false);
const [username,
  setUsername] =
  useState("");

const [password,
  setPassword] =
  useState("");
  const [expandedRegions,
  setExpandedRegions] =
  useState<string[]>([]);

const [expandedCities,
  setExpandedCities] =
  useState<string[]>([]);
  const [exceptions, setExceptions] =
  useState<any[]>([]);

const [collectedInvoices,
  setCollectedInvoices] =
  useState<string[]>([]);

const collectedSet = useMemo(
  () => new Set(collectedInvoices),
  [collectedInvoices]
);

const exceptionSet = useMemo(
  () =>
    new Set(
      exceptions.map((e) =>
        String(e.invoice)
          .replace(/\s/g, "")
          .trim()
          .toUpperCase()
      )
    ),
  [exceptions]
);
const normalize = (value: string) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
    
const normalizeInvoice = (invoice: any) =>
  String(invoice)
    .replace(/\s/g, "")
    .trim()
    .toUpperCase();
const rulesMap = useMemo(() => {
  return new Map(
    creditRules.map((rule) => [
      normalize(rule.payment_term),
      rule,
    ])
  );
}, [creditRules]);
const [lastUpdatedVans,
  setLastUpdatedVans] =
  useState<string[]>([]);

const [invoiceNo, setInvoiceNo] =
  useState("");

const [tillDate, setTillDate] =
  useState("");
  const [creditFileInfo,
  setCreditFileInfo] =
  useState("");

const [collectionFileInfo,
  setCollectionFileInfo] =
  useState("");
const isCreditOutdated = (() => {
  if (!creditFileInfo) return false;

  const match = creditFileInfo.match(
    /\d{4}-\d{2}-\d{2}/
  );

  if (!match) return false;

  const fileDate = new Date(match[0]);
  fileDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return fileDate < today;
})();
const [loadedExceptions,
  setLoadedExceptions] =
  useState(false);

const [isUploadingCredit,
  setIsUploadingCredit] =
  useState(false);

const [isUploadingCollection,
  setIsUploadingCollection] =
  useState(false);
const isBusy =
  isImportingUsers ||
  isUploadingCredit ||
  isUploadingCollection;

const [isAddingException,
  setIsAddingException] =
  useState(false);
  useEffect(() => {

  const loadRules = async () => {

    if (!currentUser) return;

    const { data } = await supabase
  .from("credit_block_rules")
  .select("*")
  .eq("username", currentUser);

setCreditRules(data || []);

  };

  loadRules();

}, [currentUser]);
    useEffect(() => {

  const loadExceptions = async () => {

    const response =
      await fetch("/api/exceptions");

    const data =
      await response.json();

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const validExceptions =
      data.filter((item: any) => {

        const tillDate =
          new Date(
            item.till_date
          );

        tillDate.setHours(
          0,
          0,
          0,
          0
        );

        return (
  item.permanent ||
  tillDate >= today
);

      });

    setExceptions(validExceptions);

    setLoadedExceptions(true);

  };

  loadExceptions();

}, []);

useEffect(() => {

  const loadUser = async () => {

    const savedUser =
      await localStorage.getItem(
        "currentUser"
      );

    if (savedUser) {

      const { data: user } =
        await supabase
          .from("app_users")
          .select("full_name, role")
          .eq("username", savedUser)
          .single();

      if (
        user?.role === "user"
      ) {
        alert(
          "You do not have permission to access this page"
        );

        window.location.href =
          "/van";

        return;
      }

      setCurrentUser(savedUser);

      setCurrentFullName(
        user?.full_name || ""
      );

      setIsLoggedIn(true);

    }

  };

  loadUser();

}, []);
useEffect(() => {

  if (currentUser) {
    localStorage.setItem(
      "currentUser",
      currentUser
    );
  } else {
    localStorage.removeItem("currentUser");
  }

}, [currentUser]);

  useEffect(() => {

  const loadFilters = async () => {

    if (currentUser) {

      const { data: userFilters } =
        await supabase
          .from("user_filters")
          .select("*")
          .eq("username", currentUser)
          .single();

      if (userFilters) {

        setSelectedRegions(
          userFilters.regions || []
        );

        setSelectedCities(
          userFilters.cities || []
        );

        setSelectedVans(
          userFilters.vans || []
        );

        return;
      }
    }

    const filterKey =
      currentUser
        ? `savedFilters_${currentUser}`
        : "savedFilters_guest";

    const saved =
      await localStorage.getItem(
        filterKey
      );

    if (!saved) return;

    const filters =
      JSON.parse(saved);

    setSelectedRegions(
      filters.regions || []
    );

    setSelectedCities(
      filters.cities || []
    );

    setSelectedVans(
      filters.vans || []
    );

  };

  loadFilters();

}, [currentUser]);
  useEffect(() => {

  const loadCollection = async () => {

    const response = await fetch(
      "/api/collection-data"
    );

    const result = await response.json();

    const invoices = (result.invoices || [])
  .map((invoice: any) =>
    String(invoice)
      .replace(/\s/g, "")
      .trim()
      .toUpperCase()
  )
  .filter(Boolean);

setCollectedInvoices(invoices);

setCollectionFileInfo(
  result.fileInfo || ""
);

  };

  loadCollection();

}, []);

useEffect(() => {

  const loadCreditData = async () => {

    const response = await fetch(
      "/api/credit-data"
    );

    const result = await response.json();

    setData(result.data || []);
    setCreditFileInfo(result.fileInfo || "");

  };

  loadCreditData();

}, []);

  const handleCreditImport = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {

  if (isUploadingCredit) return;

  setIsUploadingCredit(true);

  try {

    const file = event.target.files?.[0];

if (!file) return;

/* التحقق من ملف Credit */

const buffer = await file.arrayBuffer();

const workbook = XLSX.read(buffer, {
  type: "array",
});

const sheetName =
  workbook.SheetNames[0];

const worksheet =
  workbook.Sheets[sheetName];

const b6 = String(
  worksheet["B6"]?.v || ""
).trim();

if (b6 !== "Region") {

  toast.error("Invalid Credit File", {
    description:
      "The selected file is not a valid Credit report. Please upload the correct file.",
  });

  event.target.value = "";
  setIsUploadingCredit(false);

  return;
}
/* في حال نجاح التحقق يكمل الرفع */

const formData = new FormData();

formData.append("file", file);

const currentUsername = currentUser;

formData.append(
  "uploadedBy",
  currentUsername
);
    const uploadResponse =
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

    const uploadResult =
      await uploadResponse.json();

    
    if (!uploadResult.success) {
  alert(uploadResult.error);
  return;
}
await addLog(
  currentUser,
  currentFullName,
  "IMPORT_CREDIT",
  file.name
);


/* Reset جميع الـ Checkboxes */
await localStorage.removeItem(
  "vanPermissions"
);

await localStorage.removeItem(
  "lastUpdatedVans"
);


const response = await fetch(
  "/api/credit-data"
);
const result =
  await response.json();

setData(result.data || []);

setCreditFileInfo(
  result.fileInfo || ""
);

await fetch(
  "/api/collection-reset",
  {
    method: "POST",
  }
);
setCollectedInvoices([]);

setCollectionFileInfo("");

await localStorage.removeItem(
  "collectedInvoices"
);

await localStorage.removeItem(
  "collectionFileInfo"
);

await localStorage.removeItem(
  "lastUpdatedVans"
);
setShowImportModal(false);
  } finally {

    setIsUploadingCredit(false);

  }

};
  const handleCollectionImport = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {

  if (isUploadingCollection) return;

  setIsUploadingCollection(true);

  const file =
  event.target.files?.[0];

if (!file) {

  setIsUploadingCollection(false);

  return;

}

/* التحقق من أن الملف هو ملف Collection الصحيح */

const buffer = await file.arrayBuffer();

const workbook = XLSX.read(buffer, {
  type: "array",
});

const sheetName =
  workbook.SheetNames[0];

const worksheet =
  workbook.Sheets[sheetName];

const a1 = String(
  worksheet["A1"]?.v || ""
).trim();

if (a1 !== "Collection Submit Time") {

  toast.error("Invalid Collection File", {
    description:
      "The selected file is not a valid Collection report. Please upload the correct file.",
  });

  event.target.value = "";
  setIsUploadingCollection(false);

  return;
}
/* إذا التحقق نجح يكمل الرفع */

const currentUsername = currentUser;

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

const uploadResult = await fetch(
  "/api/collection-upload",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: fileName,
      uploadedBy: currentUsername,
      originalName: file.name,
    }),
  }
);

const result = await uploadResult.json();

if (!result.success) {
  alert(result.error);
  setIsUploadingCollection(false);
  return;
}

await addLog(
  currentUser,
  currentFullName,
  "IMPORT_COLLECTION",
  file.name
);

const reader =
  new FileReader();

  reader.onload =
    async (e) => {

      try {

        const workbook =
          XLSX.read(
            e.target?.result,
            {
              type: "binary",
            }
          );

        const sheetName =
          workbook.SheetNames[0];

        const worksheet =
          workbook.Sheets[
            sheetName
          ];

        const rows: any[] =
  XLSX.utils.sheet_to_json(
    worksheet
  );

const invoices =
  rows
    .filter((row: any) => {

      const status =
        String(
          row["Status"] ||
          row["Collection Status"] ||
          ""
        )
        .trim()
        .toLowerCase();

      return (
        status === "hold" ||
        status === "completed"
      );

    })
    .map((row: any) =>
      String(
        row["Invoice #"] ||
        row["Invoice"] ||
        ""
      )
      .trim()
      .replace(/\s/g, "")
      .toUpperCase()
    )
    .filter(Boolean);

        const previousInvoices =
  JSON.parse(
    await localStorage.getItem(
      "collectedInvoices"
    ) || "[]"
  );

const mergedInvoices = [
  ...new Set([
    ...previousInvoices,
    ...invoices,
  ]),
];

const newCollected =
  mergedInvoices.filter(
    (invoice) =>
      !previousInvoices.includes(invoice)
  );
        const affectedVans = [
  ...new Set(
    newCollected
      .map((invoice) => dataInvoiceMap.get(invoice))
      .filter(Boolean)
  ),
];
        setLastUpdatedVans(
          affectedVans
        );

        await localStorage.setItem(
          "lastUpdatedVans",
          JSON.stringify(
            affectedVans
          )
        );

        setCollectedInvoices(
  mergedInvoices
);

const now = new Date();

setCollectionFileInfo(
  `${file.name} | ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
);

await localStorage.setItem(
  "collectionFileInfo",
  `${file.name} | ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
);

await localStorage.setItem(
  "collectedInvoices",
  JSON.stringify(mergedInvoices)
);

      } finally {

  const response =
    await fetch(
      "/api/collection-data"
    );

  const refreshed =
    await response.json();

  setCollectedInvoices(
  (refreshed.invoices || [])
    .map((invoice: any) =>
      String(invoice)
        .replace(/\s/g, "")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean)
);
  setIsUploadingCollection(false);
  setShowImportModal(false);
}

    };

    reader.readAsBinaryString(file);

};
const isBlockedInvoice = (row: any) => {

  const paymentTerm = String(
  row["Payment Term"] || ""
).trim();
  const creditDays =
    Number(row["Credit_Days"]) || 0;

  const invoiceStatus = String(
    row["Invoice status (Due/ Overdue)"] || ""
  ).toLowerCase();

  const rule = rulesMap.get(
  normalize(paymentTerm)
);

// إذا ما فيه Rule لهذا الـ Payment Term
  // اعتبره Block مثل النظام القديم
  if (!rule) {
    return (
      creditDays >= 1 &&
      !invoiceStatus.includes("legal")
    );
  }

  
  return (
    creditDays >= rule.block_at_day &&
    !invoiceStatus.includes("legal")
  );
};
const dataInvoiceMap = useMemo(() => {
  const map = new Map();

  data.forEach((row) => {
    map.set(
      normalizeInvoice(row["Invoice #"]),
      row["Van Code."]
    );
  });

  return map;
}, [data]);

const filterBaseData = useMemo(() => {
  return data.filter((row) => {

    const isNotCentral =
      String(row["Central Invoice"] || "")
        .trim()
        .toUpperCase() === "NOT CENTRAL";

    const matchesFilters =
      (
        selectedRegions.length === 0 ||
        selectedRegions.includes(row["Region"])
      ) &&
      (
        selectedCities.length === 0 ||
        selectedCities.includes(row["City"])
      ) &&
      (
        selectedVans.length === 0 ||
        selectedVans.includes(row["Van Code."])
      );

    const search =
      searchText.toLowerCase().trim();

    const matchesSearch =
      !search ||
      [
        row["Van Code."],
        row["Employee Name."],
        row["Employee ATS Code."],
        row["Customer Code"],
        row["Customer Name"],
        row["Invoice #"],
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);

    return (
      isNotCentral &&
      matchesFilters &&
      matchesSearch
    );
  });
}, [
  data,
  selectedRegions,
  selectedCities,
  selectedVans,
  searchText,
]);

  
const filteredData = useMemo(() => {
  return filterBaseData
    .filter((row) => {

      const invoice = normalizeInvoice(
        row["Invoice #"]
      );

      const paymentTerm = String(
        row["Payment Term"] || ""
      ).trim();

      const invoiceStatus = String(
        row["Invoice status (Due/ Overdue)"] || ""
      ).toLowerCase();

      if (invoiceStatus.includes("legal")) {
        return false;
      }

      const rule = rulesMap.get(
        normalize(paymentTerm)
      );

      const creditDays =
        Number(row["Credit_Days"]) || 0;

      const showInvoice = rule
  ? creditDays >= rule.block_at_day
  : creditDays >= 1;
      return (
        showInvoice ||
        exceptionSet.has(invoice)
      );
    })
    .sort((a, b) =>
      String(a["Van Code."] || "").localeCompare(
        String(b["Van Code."] || "")
      )
    );
}, [
  filterBaseData,
  rulesMap,
  exceptionSet,
]);
const whatsappData = useMemo(() => {
  return filteredData.filter((row) => {
    if (row["Van Code."] !== whatsAppVan) {
      return false;
    }

    const invoice = normalizeInvoice(
      row["Invoice #"]
    );

    return (
      !exceptionSet.has(invoice) &&
      !collectedSet.has(invoice)
    );
  });
}, [
  filteredData,
  whatsAppVan,
  exceptionSet,
  collectedSet,
]);
const displayedData = useMemo(() => {
  if (!whatsAppVan) {
    return filteredData;
  }

  return filteredData.filter(
    (row) => row["Van Code."] === whatsAppVan
  );
}, [
  filteredData,
  whatsAppVan,
]);
const blockedInvoicesData = useMemo(() => {
  return filteredData.filter((row) => {

    const invoice = normalizeInvoice(
  row["Invoice #"]
);
    return (
      !exceptionSet.has(invoice) &&
      !collectedSet.has(invoice)
    );
  });
}, [
  filteredData,
  exceptionSet,
  collectedSet,
]);
const selectedVanData = useMemo(() => {
  if (!whatsAppVan) {
    return blockedInvoicesData;
  }

  return blockedInvoicesData.filter(
    (row) => row["Van Code."] === whatsAppVan
  );
}, [blockedInvoicesData, whatsAppVan]);

const selectedVanFilteredData = useMemo(() => {
  if (!whatsAppVan) {
    return filteredData;
  }

  return filteredData.filter(
    (row) => row["Van Code."] === whatsAppVan
  );
}, [filteredData, whatsAppVan]);
const whatsappVanCodes = useMemo(() => {
  return [
    ...new Set(
      blockedInvoicesData
        .map((row) => row["Van Code."])
        .filter(Boolean)
    ),
  ].sort((a, b) => {
    const aIsHFR = String(a).includes("HFR");
    const bIsHFR = String(b).includes("HFR");

    if (aIsHFR && !bIsHFR) return 1;
    if (!aIsHFR && bIsHFR) return -1;

    return String(a).localeCompare(
      String(b),
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );
  });
}, [blockedInvoicesData]);
useEffect(() => {
  if (
    whatsAppVan &&
    !whatsappVanCodes.includes(whatsAppVan)
  ) {
    setWhatsAppVan("");
  }
}, [whatsappVanCodes, whatsAppVan]);

const filteredInvoiceSet = useMemo(
  () =>
    new Set(
      filteredData.map((row) =>
        normalizeInvoice(row["Invoice #"])
      )
    ),
  [filteredData]
);
const regions = useMemo(() => {
  return [...new Set(data.map(row => row["Region"]))]
    .filter(Boolean)
    .sort();
}, [data]);
const vansByCity = useMemo(() => {
  const map = new Map();

  data.forEach((row) => {
    const key =
      `${row["Region"]}|${row["City"]}`;

    if (!map.has(key)) {
      map.set(key, new Set());
    }

    map.get(key).add(row["Van Code."]);
  });

  return map;
}, [data]);
const citiesByRegion = useMemo(() => {
  const map = new Map();

  data.forEach((row) => {
    const region = row["Region"];
    const city = row["City"];

    if (!region || !city) return;

    if (!map.has(region)) {
      map.set(region, new Set());
    }

    map.get(region).add(city);
  });

  return map;
}, [data]);
const {
  blockedCount,
  employeeCount,
  legalCount,
  exceptionCount,
  activeEmployees,
} = useMemo(() => {
console.log("DATA", data.length);
console.log("FILTER BASE", filterBaseData.length);
console.log("FILTERED", filteredData.length);
console.log("BLOCKED", blockedInvoicesData.length);
  const blockedCount =
  selectedVanData.length;
  const employeeCount =
  new Set(
    selectedVanFilteredData.map(
      (row) => row["Van Code."]
    )
  ).size;
const legalCount =
  exceptions.filter((item) => {

    if (!item.permanent) {
      return false;
    }

    const invoice =
      normalizeInvoice(
        item.invoice
      );

    if (
      !filteredInvoiceSet.has(
        invoice
      )
    ) {
      return false;
    }

    if (!whatsAppVan) {
      return true;
    }

    return (
      dataInvoiceMap.get(
        invoice
      ) === whatsAppVan
    );

  }).length;

  const exceptionCount =
  exceptions.filter((item) => {
    if (item.permanent) return false;

    const invoice = normalizeInvoice(item.invoice);

    if (!filteredInvoiceSet.has(invoice)) {
      return false;
    }

    if (!whatsAppVan) {
      return true;
    }

    return dataInvoiceMap.get(invoice) === whatsAppVan;
  }).length;

  const allVans = new Set(
  selectedVanFilteredData.map(
    (row) => row["Van Code."]
  )
);

const blockedVans = new Set(
  selectedVanData.map(
    (row) => row["Van Code."]
  )
);

const activeEmployees = [...allVans].filter(
  (van) => !blockedVans.has(van)
).length;
  return {
    blockedCount,
    employeeCount,
    legalCount,
    exceptionCount,
    activeEmployees,
  };

}, [
  selectedVanData,
  selectedVanFilteredData,
  exceptions,
  filteredInvoiceSet,
  dataInvoiceMap,
  whatsAppVan,
]);
const topBlockedVans = useMemo(() => {
  return Object.entries(
    blockedInvoicesData.reduce((acc: any, row) => {
      const van = row["Van Code."];

      acc[van] =
        (acc[van] || 0) + 1;

      return acc;
    }, {})
  )
    .sort(
      (a: any, b: any) =>
        Number(b[1]) - Number(a[1])
    )
    .slice(0, 5);
}, [blockedInvoicesData]);
const topClearedVans = useMemo(() => {
  return Object.entries(
    filteredData.reduce((acc: any, row) => {
      const invoice = normalizeInvoice(
        row["Invoice #"]
      );

      const van = row["Van Code."];

      if (
        exceptionSet.has(invoice) ||
        collectedSet.has(invoice)
      ) {
        acc[van] =
          (acc[van] || 0) + 1;
      }

      return acc;
    }, {})
  )
    .sort(
      (a: any, b: any) =>
        Number(b[1]) - Number(a[1])
    )
    .slice(0, 5);
}, [
  filteredData,
  exceptionSet,
  collectedSet,
]);
      const toggleRegion = (
  region: string
) => {

  setExpandedRegions(prev =>

    prev.includes(region)

      ? prev.filter(
          r => r !== region
        )

      : [...prev, region]

  );

};

const toggleCity = (
  cityKey: string
) => {

  setExpandedCities(prev =>

    prev.includes(cityKey)

      ? prev.filter(
          c => c !== cityKey
        )

      : [...prev, cityKey]

  );

};
const generateReportImage =
  async () => {

    if (isSendingWhatsApp) return;

    setIsSendingWhatsApp(true);

    try {

      const report =
        document.getElementById(
          "whatsapp-report"
        );

      if (!report) {
        alert("Report Not Found");
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
          (resolve) =>
            canvas.toBlob(
              (blob) =>
                resolve(blob),
              "image/png"
            )
        );

      if (!blob) {
        alert(
          "Failed to create image"
        );
        return;
      }

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
            whatsAppVan
        );

      if (!selectedUser) {
        alert(
          `Van ${whatsAppVan} not found in Users`
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

  <div className="min-h-screen bg-[#f4f7fc] flex text-slate-900">

  <aside className="w-52 bg-[#071d5c] text-white flex flex-col">

    <div className="p-4">
      <h1 className="text-xl font-bold leading-tight">
        Credit With Route Block
      </h1>
    </div>

  
      {/* Sidebar */}
       <nav className="px-4 space-y-2">

  <Link
    href="/"
    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600"  >
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
    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition"  >
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

  await localStorage.removeItem(
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

                {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 flex justify-between items-center">

          <h2 className="text-3xl font-bold">
            Dashboard
          </h2>

          <div className="flex gap-8">
            <span>
              Today: {new Date().toLocaleDateString()}
            </span>


          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">

  <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

  <ShieldX
    size={130}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500/5"
  />

  <p className="text-slate-500 text-sm relative z-10">
    Blocked Invoices
  </p>

  <h2 className="text-4xl font-bold text-slate-900 mt-2 relative z-10">
    {blockedCount}
  </h2>

  <div className="mt-4 h-1 rounded-full bg-red-500" />



</div>
  <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

  <FileWarning
    size={130}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500/5"
  />

  <p className="text-slate-500 text-sm relative z-10">
  Exceptions
</p>

<h2 className="text-4xl font-bold text-slate-900 mt-2 relative z-10">
  {exceptionCount}
</h2>

<div className="mt-4 h-1 rounded-full bg-orange-500" />

<div className="flex items-center mt-4 relative z-10">
  <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs">
    Legal: {legalCount}
  </span>
</div>

</div>
  <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

  <ShieldCheck
    size={130}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500/5"
  />

  <p className="text-slate-500 text-sm relative z-10">
    Active
  </p>

  <h2 className="text-4xl font-bold text-slate-900 mt-2 relative z-10">
    {activeEmployees}
  </h2>

  <div className="mt-4 h-1 rounded-full bg-green-500" />

</div>
  <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">

  <Users
    size={130}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/5"
  />

  <p className="text-slate-500 text-sm relative z-10">
    Employees
  </p>

  <h2 className="text-4xl font-bold text-slate-900 mt-2 relative z-10">
    {employeeCount}
  </h2>

  <div className="mt-4 h-1 rounded-full bg-blue-500" />

</div>
</div>

{/* Import Center */}
{data.length > 0 && (
  <div className="mb-6">

    <div className="grid md:grid-cols-2 gap-5">

      {/* Credit Status */}

      <div
  className={`relative bg-white rounded-3xl shadow-sm overflow-hidden ${
    isCreditOutdated
      ? "border-2 border-red-600 animate-bounce"
      : "border border-slate-200"
  }`}
>

  <FileSpreadsheet
    size={140}
    className={`absolute right-6 top-1/2 -translate-y-1/2 ${
      isCreditOutdated
        ? "text-red-500/10"
        : "text-blue-500/5"
    }`}
  />

  <div
    className={`h-2 ${
      isCreditOutdated
        ? "bg-red-600"
        : "bg-blue-600"
    }`}
  />

  <div className="p-6 relative z-10">

    <div className="flex items-center justify-between mb-5">

      <div className="flex items-center gap-4">

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isCreditOutdated
              ? "bg-red-100"
              : "bg-blue-100"
          }`}
        >
          <FileSpreadsheet
            size={28}
            className={
              isCreditOutdated
                ? "text-red-600"
                : "text-blue-600"
            }
          />
        </div>

        <div>

          <h4
            className={`font-bold text-lg ${
              isCreditOutdated
                ? "text-red-700"
                : ""
            }`}
          >
            Credit Data
          </h4>

          <p
            className={`text-sm ${
              isCreditOutdated
                ? "text-red-500"
                : "text-slate-500"
            }`}
          >
            Credit Block Report
          </p>

        </div>

      </div>

      <CheckCircle
        size={24}
        className={
          creditFileInfo
            ? "text-green-500"
            : "text-slate-300"
        }
      />

    </div>

    <div
      className={`rounded-2xl p-4 ${
        isCreditOutdated
          ? "bg-red-50 border border-red-200"
          : "bg-slate-50"
      }`}
    >

      <p
        className={`text-xs uppercase tracking-wide mb-1 ${
          isCreditOutdated
            ? "text-red-400"
            : "text-slate-400"
        }`}
      >
        Latest File
      </p>

      <p
        className={`text-sm break-words ${
          isCreditOutdated
            ? "text-red-700 font-semibold"
            : "text-slate-700"
        }`}
      >
        {creditFileInfo || "No Credit File Imported"}
      </p>

      {isCreditOutdated && (
        <div className="mt-3 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl font-bold">
          ⚠ Credit File Is Outdated
        </div>
      )}

    </div>

  </div>

</div>
      {/* Collection Status */}

      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

  <ClipboardList
    size={140}
    className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500/5"
  />

  <div className="h-2 bg-green-600" />

  <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-5">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                <FileSpreadsheet
                  size={28}
                  className="text-green-600"
                />
              </div>

              <div>

                <h4 className="font-bold text-lg">
                  Collection Data
                </h4>

                <p className="text-sm text-slate-500">
                  Collection Report
                </p>

              </div>

            </div>

            <CheckCircle
              size={24}
              className={
                collectionFileInfo
                  ? "text-green-500"
                  : "text-slate-300"
              }
            />

          </div>

          <div className="bg-slate-50 rounded-2xl p-4">

            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
              Latest File
            </p>

            <p className="text-sm text-slate-700 break-words">
              {collectionFileInfo ||
                "No Collection File Imported"}
            </p>

          </div>

        </div>

      </div>

    </div>

  </div>
)}
        <div className="grid grid-cols-3 gap-6">

          {/* Table */}
          <div className="col-span-2 bg-white rounded-xl border shadow-sm p-5">

            <div className="flex justify-between items-center mb-5">

  <h3 className="font-bold text-xl">
    Active Credit Blocks
  </h3>

  <div className="flex gap-2 items-center">

    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-3"
      />

    <input
  value={searchText}
  onChange={(e) =>
    setSearchText(e.target.value)
  }
  placeholder="Search..."
  className="border rounded-lg pl-10 py-2 px-4 w-40 h-[42px]"/>
    </div>

    <select
      value={whatsAppVan}
      onChange={(e) =>
        setWhatsAppVan(e.target.value)
      }
      className="border rounded-lg px-3 py-2"
    >

      <option value="">
        Select Van
      </option>

      {whatsappVanCodes.map(
        (van) => (
          <option
            key={van}
            value={van}
          >
            {van}
          </option>
        )
      )}
    </select>

<button
  disabled={
    isSendingWhatsApp ||
    !whatsAppVan
  }
  onClick={generateReportImage}
  className={`text-white px-4 py-2 rounded-lg ${
    isSendingWhatsApp ||
    !whatsAppVan
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
>
  {isSendingWhatsApp
    ? "Processing..."
    : "WhatsApp"}
</button>

  </div>

</div>

            <div className="overflow-auto max-h-[600px]">

              <table className="min-w-[1700px] text-sm">

                <thead>

                  <tr className="bg-[#0b2668] text-white">

<th className="p-3">Van Code</th>
<th className="p-3">Employee Name</th>
<th className="p-3">ATS Code</th>
<th className="p-3">Customer Code</th>
<th className="p-3">Customer Name</th>
<th className="p-3">Central Invoice</th>
<th className="p-3">Payment Term</th>
<th className="p-3">Invoice #</th>
<th className="p-3">Trx Date</th>
<th className="p-3">Credit Amount</th>
<th className="p-3">Pending CIM</th>
<th className="p-3">Credit Days</th>
<th className="p-3">Rejected Count</th>
<th className="p-3">Status</th>

                  </tr>

                </thead>

                <tbody>

                 {displayedData
  .slice(0, 100)
  .map((row, index) => (
                          <tr
  key={index}
  className="border-b"
  style={{
  backgroundColor: collectedSet.has(
    normalizeInvoice(row["Invoice #"])
  )
    ? "#C6EFCE"
    : exceptionSet.has(
        normalizeInvoice(row["Invoice #"])
      )
    ? "#FFCB96"
    : "",
}}

>
                      <td className="p-3">
  {row["Van Code."]}
</td>

<td className="p-3">
  {row["Employee Name."]}
</td>

<td className="p-3">
  {row["Employee ATS Code."]}
</td>

<td className="p-3">
  {row["Customer Code"]}
</td>

<td className="p-3">
  {row["Customer Name"]}
</td>

<td className="p-3">
  {row["Central Invoice"]}
</td>

<td className="p-3">
  {row["Payment Term"]}
</td>

<td className="p-3">
  {row["Invoice #"]}
</td>

<td className="p-3">
  {new Date(
    (Number(row["Trx Date"]) - 25569) *
      86400 *
      1000
  ).toLocaleDateString("en-GB")}
</td>

<td className="p-3">
  {row["Credit Invoice Amount"]}
</td>

<td className="p-3">
  {row["Pending CIM"]}
</td>

<td className="p-3">
  {row["Credit_Days"]}
</td>

<td className="p-3">
  {row["Total Rejected Count"]}
</td>
<td className="p-3">

  {isBlockedInvoice(row) ? (

    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
      Block
    </span>

  ) : (

    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
      Open
    </span>

  )}

</td>
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>

          {/* Exception Panel */}
          <div className="bg-white rounded-xl border shadow-sm p-5">

            <h3 className="font-bold text-xl mb-5">
              Exception Invoices
            </h3>

{isLoggedIn && (
  <>
    <input
      value={invoiceNo}
      onChange={(e) =>
        setInvoiceNo(e.target.value)
      }
      placeholder="Invoice No."
      className="w-full border rounded-lg p-3 mb-3"
    />

<input
  type="date"
  value={tillDate}
  min={new Date().toISOString().split("T")[0]}
  onChange={(e) =>
    handleDateChange(e.target.value)
  }
  className="w-full border rounded-lg p-3 mb-3"
/>

{tillDate && (
  <div className="mb-3 text-sm text-green-600 font-semibold">
    Exception Duration:
    <span className="ml-2">
      {calculateBusinessDays(tillDate)}
      {" "}
      Working Days
    </span>
  </div>
)}
  </>
)}

            

        

{isLoggedIn && (

<button
  disabled={isAddingException}
  className={`text-white w-full py-3 rounded-lg ${
    isAddingException
      ? "bg-slate-400"
      : "bg-blue-600"
  }`}
  onClick={async () => {

  if (isAddingException) return;

  setIsAddingException(true);

  try {

  const invoice =
        invoiceNo
        .replace(/\s/g, "")
        .toUpperCase();

    if (
      !invoice ||
      !tillDate
    ) {
      return;
    }

    await fetch(
      "/api/exceptions",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify([
          {
            invoice,
            till_date: tillDate,
            created_by: currentUser,
          },
        ]),
      }
    );
await addLog(
  currentUser,
  currentFullName,
  "ADD_EXCEPTION",
  invoice
);
    const response =
      await fetch(
        "/api/exceptions"
      );

    const data =
      await response.json();

    setExceptions(
  data.filter((item: any) => {

    const tillDate =
      new Date(item.till_date);

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    tillDate.setHours(
      0,
      0,
      0,
      0
    );

    return tillDate >= today;

  })
);

    setInvoiceNo("");
    setTillDate("");
  } finally {

    setIsAddingException(false);

  }
  }}
>
  {isAddingException
  ? "Processing..."
  : "Add Exception"}
  </button>
)}
            <div className="mt-8">

  <h4 className="font-bold mb-4">
    Current Exceptions
  </h4>

  <div className="max-h-[350px] overflow-y-auto border rounded-lg">

    <table className="w-full text-sm">

      <thead className="sticky top-0 bg-white z-10">

        <tr className="border-b">

          <th className="text-left p-2">
            Invoice
          </th>

          <th className="text-left p-2">
            Till Date
          </th>

          <th className="text-left p-2">
            Days
          </th>

          {isLoggedIn && (

            <th className="text-left p-2">
              Delete
            </th>

          )}

        </tr>

      </thead>

      <tbody>

        {exceptions
  .filter((item) => {
    if (item.permanent) return false;

    const invoice = normalizeInvoice(
  item.invoice
);

if (!filteredInvoiceSet.has(invoice)) {
  return false;
}

if (!whatsAppVan) {
  return true;
}

return (
  dataInvoiceMap.get(invoice) === whatsAppVan
);

})
.map((item, index) => {
            const tillDate =
            new Date(item.till_date);

          const daysLeft =
  item.till_date
    ? calculateBusinessDays(
        item.till_date
      )
    : "-";
              return (


<tr key={index}>

<td className="p-2">
  <Link
    href={`/exceptions?invoice=${encodeURIComponent(item.invoice)}`}
    className="text-blue-600 hover:underline font-medium"
  >
    {item.invoice}
  </Link>
</td>
<td className="p-2">
  {item.till_date
    ? new Date(
        item.till_date
      ).toLocaleDateString()
    : "-"}
</td>

<td className="p-2">
  {daysLeft}
</td>

              <td className="p-2">

                {isLoggedIn &&
item.created_by === currentUser && (
<button
  disabled={deletingExceptionId === item.id}
  className={`px-2 py-1 rounded text-white ${
    deletingExceptionId === item.id
      ? "bg-slate-400"
      : "bg-red-600"
  }`}
  onClick={async () => {

    if (deletingExceptionId === item.id)
      return;

    setDeletingExceptionId(item.id);

    try {

      await fetch(
        `/api/exceptions/${item.id}`,
        {
          method: "DELETE",
        }
      );

      await addLog(
        currentUser,
        currentFullName,
        "DELETE_EXCEPTION",
        item.invoice
      );

      setExceptions(
        prev =>
          prev.filter(
            exception =>
              exception.id !== item.id
          )
      );

    } finally {

      setDeletingExceptionId(null);

    }

  }}
>
  {deletingExceptionId === item.id
    ? "..."
    : "X"}
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
    
              </div>
              

            </div>


       
        
{/* Summary Section */}

<div className="grid grid-cols-3 gap-6 mt-6">

  <div className="col-span-1 bg-white rounded-xl border shadow-sm p-5">

  <h3 className="font-bold mb-4">
    Employees Cleared Today
  </h3>

  <table className="w-full text-sm">

    <thead>
      <tr className="border-b">
        <th className="text-left p-2">
  Van Code
</th>

        <th className="text-left p-2">
          Cleared
        </th>
      </tr>
    </thead>

    <tbody>

     {topClearedVans.map(
  ([van, total]: any) => (

    <tr key={van}>

      <td className="p-2">
        {van}
      </td>

      <td className="p-2 text-green-600 font-semibold">
        {total}
      </td>

    </tr>

  )
)}
    </tbody>

  </table>

</div>
<div className="bg-white rounded-xl border shadow-sm p-5">

  <h3 className="font-bold mb-4">
    Top Vans With Blocks
  </h3>

  <div className="space-y-4">

    {topBlockedVans.map(
  ([van, total]: any) => (

          <div key={van}>

            <div className="flex justify-between mb-1">

              <span>{van}</span>

              <span className="font-semibold">
                {total}
              </span>

            </div>

            <div className="h-3 bg-slate-200 rounded-full">

              <div
                className="h-3 bg-blue-600 rounded-full"
                style={{
                  width: `${Math.min(
                    Number(total) * 5,
                    100
                  )}%`,
                }}
              />

            </div>

          </div>

        )
      )}

  </div>

</div>
    <div className="bg-white rounded-xl border shadow-sm p-5">

  <h3 className="font-bold mb-4">
    Collection Progress
  </h3>

  <div className="flex justify-between mb-4">

    <div>
      <p className="text-sm text-slate-500">
        Cleared
      </p>

      <h2 className="text-3xl font-bold text-green-600">
        {
          filteredData.filter((row) => {
            const invoice = normalizeInvoice(
              row["Invoice #"]
            );

            return (
              exceptionSet.has(invoice) ||
              collectedSet.has(invoice)
            );
          }).length
        }
      </h2>
    </div>

    <div>
      <p className="text-sm text-slate-500">
        Remaining
      </p>

      <h2 className="text-3xl font-bold text-red-600">
        {blockedCount}
      </h2>
    </div>

  </div>

  <div className="w-full bg-slate-200 rounded-full h-4">

    <div
      className="bg-green-600 h-4 rounded-full"
      style={{
        width: `${Math.round(
          (
            filteredData.filter((row) => {
              const invoice = normalizeInvoice(
                row["Invoice #"]
              );

              return (
                exceptionSet.has(invoice) ||
                collectedSet.has(invoice)
              );
            }).length /
            Math.max(filteredData.length, 1)
          ) * 100
        )}%`,
      }}
    />

  </div>

</div>
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

localStorage.setItem(
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
</>
);
}
