"use client";

import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import html2canvas from "html2canvas";
import WhatsAppReport from "@/components/WhatsAppReport";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { storage as localStorage } from "@/utils/storage";

export default function MobileSummaryPage() {
  const pathname = usePathname();  
  const [whatsAppVan, setWhatsAppVan] =
  useState("");

const [isSendingWhatsApp,
  setIsSendingWhatsApp] =
  useState(false);
  const [isYasser, setIsYasser] =
  useState(false);
  const [searchTerm, setSearchTerm] = useState("");
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [isCheckingUser, setIsCheckingUser] = useState(true);

const [selectedRegions, setSelectedRegions] =
  useState<string[]>([]);

const [selectedCities, setSelectedCities] =
  useState<string[]>([]);

const [selectedVans, setSelectedVans] =
  useState<string[]>([]);
  const [data,setData] = useState<any[]>([]);
  const [exceptions,setExceptions] = useState<any[]>([]);
  const [collectedInvoices,setCollectedInvoices] = useState<string[]>([]);
  const [creditRules,setCreditRules] = useState<any[]>([]);
  const [permissions, setPermissions] =
  useState<any>({});

  

useEffect(() => {

  let cancelled = false;

  const load = async () => {

    const currentUser =
      await localStorage.getItem("currentUser");

    if (cancelled) return;

    if (!currentUser) {
  setIsLoggedIn(false);
  setData([]);
  setExceptions([]);
  setCollectedInvoices([]);
  setCreditRules([]);
  setIsCheckingUser(false);

  return;
}

setIsLoggedIn(true);
setIsCheckingUser(false);
    const credit =
      await fetch("/api/credit-data");

    const creditData =
      await credit.json();

    if (cancelled) return;

    setData(
      creditData.data || []
    );

    const ex =
      await fetch("/api/exceptions");

    const exceptionsData =
      await ex.json();

    if (cancelled) return;

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const validExceptions =
      exceptionsData.filter(
        (item: any) => {

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

        }
      );

    setExceptions(
      validExceptions
    );

    const col =
      await fetch(
        "/api/collection-data"
      );

    const colData =
      await col.json();

    if (cancelled) return;

    setCollectedInvoices(
      colData.invoices || []
    );

    setIsYasser(
      String(currentUser)
        .trim()
        .toLowerCase() === "yasser"
    );

    const { data: rules } =
      await supabase
        .from("credit_block_rules")
        .select("*");

    if (cancelled) return;

    setCreditRules(
  rules || []
);

const { data: permissionData } =
  await supabase
    .from("van_permissions")
    .select("*");

const mappedPermissions: any = {};

(permissionData || []).forEach(
  (item: any) => {
    mappedPermissions[
      item.van_code
    ] = item.is_unblocked;
  }
);

setPermissions(
  mappedPermissions
);

const savedFilters =
  await localStorage.getItem(
    `savedFilters_${currentUser}`
  );
    if (cancelled) return;

    if (
      savedFilters &&
      String(currentUser)
        .trim()
        .toLowerCase() !== "yasser"
    ) {

      const filters =
        JSON.parse(
          savedFilters
        );

      setSelectedRegions(
        filters.regions || []
      );

      setSelectedCities(
        filters.cities || []
      );

      setSelectedVans(
        filters.vans || []
      );

    }

  };

  load();

  const handleUserChanged = () => {
    load();
  };

  window.addEventListener(
    "user-changed",
    handleUserChanged
  );

  return () => {

    cancelled = true;

    window.removeEventListener(
      "user-changed",
      handleUserChanged
    );

  };

}, [pathname]);

if (isCheckingUser) {
  return null;
}

const filteredData = !isLoggedIn
  ? []
  : data.filter((row) => {

const normalize=(v:string)=>
String(v||"")
.replace(/^ATS\s+/i,"")
.replace(/\s+/g," ")
.trim()
.toUpperCase();



const paymentTerm =
String(
row["Payment Term"] || ""
).trim();


const rule =
creditRules.find(
r =>
normalize(r.payment_term)
===
normalize(paymentTerm)
);


const creditDays =
Number(row["Credit_Days"])||0;


const showInvoice = rule
  ? creditDays >= rule.block_at_day
  : creditDays >= 1;

const matchesFilters =

(
  selectedRegions.length === 0 ||
  selectedRegions.includes(
    row["Region"]
  )
)

&&

(
  selectedCities.length === 0 ||
  selectedCities.includes(
    row["City"]
  )
)

&&

(
  (
  isYasser
    ? String(row["Region"] || "")
        .trim()
        .toUpperCase() === "EAST"
    : (
        selectedVans.length === 0 ||
        selectedVans.includes(
          row["Van Code."]
        )
      )
)
);
    
return (

matchesFilters

&&

String(
row["Central Invoice"]
)
.trim()
.toUpperCase()
===
"NOT CENTRAL"

&&


!String(
row["Invoice status (Due/ Overdue)"] || ""
)
.toLowerCase()
.includes("legal")


&&

showInvoice

);


});



const vans =
Object.entries(

filteredData.reduce(
(acc:any,row)=>{


const van =
row["Van Code."];


if(!acc[van]){

acc[van]={
ids:new Set(),
remaining:0,
exceptions:0
};
}


acc[van].ids.add(
row["Employee ATS Code."]
);



const invoice =
String(row["Invoice #"])
.replace(/\s/g,"")
.toUpperCase();



const ex =
exceptions.some(
(e:any)=>
String(e.invoice)
.replace(/\s/g,"")
.toUpperCase()
===
invoice
);



const collected =
collectedInvoices.some(
(i)=>
String(i)
.replace(/\s/g,"")
.toUpperCase()
===
invoice
);



if(ex){

acc[van].exceptions++;

}
else if(!collected){

acc[van].remaining++;

}



return acc;


},{}

)

);

const filteredVans = !isLoggedIn
  ? []
  : vans.filter(([van]) => {
      return String(van)
        .toLowerCase()
        .includes(searchTerm.toLowerCase().trim());
    });
    const whatsappData = !isLoggedIn
  ? []
  : filteredData.filter(
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
const getStatus=(r:number,e:number)=>{

if(r>0 && e>0)
return `${r} Remaining , Ex`;

if(r>0)
return `${r} Remaining`;

if(e>0)
return "Ex & All Collected";

return "All Collected";

};

const sendWhatsApp = async (
  vanCode: string
) => {

  if (isSendingWhatsApp)
    return;

  setIsSendingWhatsApp(true);

  try {

    setWhatsAppVan(vanCode);

    await new Promise(
      resolve => setTimeout(resolve, 200)
    );

    const report =
      document.getElementById(
  "whatsapp-report-container"
);
    if (!report) return;

    const canvas =
      await html2canvas(report, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

    const blob =
      await new Promise<Blob | null>(
        resolve =>
          canvas.toBlob(
            blob => resolve(blob),
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
          user.van_sub_inventory === vanCode
      );

    if (!selectedUser) return;

    const phoneNumber = String(
  selectedUser.contact || ""
)
.replace(/\D/g, "");
    let whatsappNumber = phoneNumber;

if (phoneNumber.startsWith("05")) {
  whatsappNumber = `966${phoneNumber.slice(1)}`;
} else if (phoneNumber.startsWith("5")) {
  whatsappNumber = `966${phoneNumber}`;
}
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
      id="whatsapp-report-container"
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

    <div className="min-h-screen bg-slate-100 p-3">

    <div className="mb-4">
  <input
    type="text"
    placeholder="Search Van Code..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="
      w-full
      h-10
      px-3
      text-sm
      border
      border-slate-300
      rounded-lg
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
      bg-white
    "
  />
</div>
    {!isLoggedIn && (
  <div className="bg-white rounded-xl shadow p-6 text-center">
  </div>
)}
{isLoggedIn && (
<table
  className="
w-full
text-sm
"
>

<thead
  className="
bg-[#071d5c]
text-white
"
>

<tr>


<th className="p-3">
Status
</th>

<th className="p-3">
ID
</th>

<th className="p-3">
Van Code
</th>

</tr>


</thead>

<tbody>

{
filteredVans
  .sort((a: any, b: any) => {
    const vanA = String(a[0]).toUpperCase().trim();
    const vanB = String(b[0]).toUpperCase().trim();

    const isHFRA = vanA.startsWith("HFR");
    const isHFRB = vanB.startsWith("HFR");

    if (isHFRA && !isHFRB) return 1;
    if (!isHFRA && isHFRB) return -1;

    return vanA.localeCompare(
      vanB,
      undefined,
      { numeric: true }
    );
  })
.map(([van,info]:any)=>(

<tr
key={van}
className={`
border-b
${
  permissions[van]
    ? "bg-green-100"
    : getStatus(
        info.remaining,
        info.exceptions
      ) === "All Collected" ||
      getStatus(
        info.remaining,
        info.exceptions
      ) === "Ex & All Collected"
    ? "bg-yellow-50"
    : ""
}
`}
>


<td className="p-3 text-center">
  <div className="relative inline-flex items-center justify-center w-[190px]">

    {info.remaining > 0 && (
      <button
        onClick={() => sendWhatsApp(String(van))}
        className="absolute left-0 text-green-600 hover:text-green-700"
      >
        <FaWhatsapp size={20} />
      </button>
    )}

    <span
  className={`
    inline-flex
    items-center
    justify-center
    min-w-[150px]
    px-3
    py-1
    rounded-full
    text-xs
    font-bold
    border border-black/10
    ${
      info.remaining === 0 && info.exceptions === 0
        ? "bg-green-100 text-green-700"
        : info.remaining > 0
        ? "bg-pink-100 text-pink-700"
        : "bg-orange-100 text-orange-700"
    }
  `}
>
      {getStatus(info.remaining, info.exceptions)}
    </span>

  </div>
</td>
<td className="p-3 text-center">
{[...info.ids].join(" / ")}
</td>

<td
  className="
    p-3
    text-center
    font-bold
  "
>
  <Link
    href={`/van/${encodeURIComponent(String(van))}`}
    className="text-blue-600 underline"
  >
    {van}
  </Link>
</td>

</tr>

))

}

</tbody>

</table>
)}
</div>


  </>
);

}