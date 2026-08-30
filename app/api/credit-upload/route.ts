import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {

  console.time("TOTAL_IMPORT");

  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const uploadedBy = String(formData.get("uploadedBy") || "");

    if (!file) {
      return NextResponse.json({
        success: false,
        error: "No file uploaded",
      });
    }
console.time("READ_EXCEL");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const creditCell = worksheet["B3"];

let creditFileDate = "";

if (creditCell) {
  if (typeof creditCell.v === "number") {
    const parsed = XLSX.SSF.parse_date_code(
      creditCell.v
    );

    creditFileDate =
      `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  } else {
    const rawDate = String(
      creditCell.w || creditCell.v || ""
    ).trim();

    const match = rawDate.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
    );

    if (match) {
      const [, day, month, year] = match;

      creditFileDate =
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    } else {
      creditFileDate = rawDate.slice(0, 10);
    }
  }
}

    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      range: 5,
      defval: "",
    });
console.timeEnd("READ_EXCEL");
 console.time("DELETE_OLD_DATA");

const clearCreditDataResult =
  await supabase.rpc(
    "clear_credit_data"
  );
await supabase
  .from("collection_invoices")
  .delete()
  .neq("invoice", "");

await supabase
  .from("collection_uploads")
  .delete()
  .gt("id", 0);

await supabase
  .from("van_invoice_counts")
  .delete()
  .neq("van_code", "");
  const { data: files } =
  await supabase.storage
    .from("imports")
    .list();

if (files?.length) {
  await supabase.storage
    .from("imports")
    .remove(
      files.map(file => file.name)
    );
}
if (clearCreditDataResult.error) {
  throw clearCreditDataResult.error;
}

console.timeEnd("DELETE_OLD_DATA");

console.time("MAP_ROWS");
const allRecords = jsonData.map((row) => ({
  invoice: String(row["Invoice #"])
    .replace(/\s/g, "")
    .trim()
    .toUpperCase(),

  van_code: row["Van Code."],
  employee_name: row["Employee Name."],
  employee_ats_code: row["Employee ATS Code."],

  customer_code: row["Customer Code"],
  customer_name: row["Customer Name"],

  central_invoice: row["Central Invoice"],
  payment_term: row["Payment Term"],

  trx_date: String(row["Trx Date"]),

  credit_invoice_amount:
    Number(row["Credit Invoice Amount"]) || 0,

  pending_cim:
    Number(row["Pending CIM"]) || 0,

  credit_days:
    Number(row["Credit_Days"]) || 0,

  total_rejected_count:
    Number(row["Total Rejected Count"]) || 0,

  region: row["Region"],
  city: row["City"],

  status_user_block:
    row["Status User Block"],

  invoice_status:
    row["Invoice status (Due/ Overdue)"],

  uploaded_by: uploadedBy,
  file_name: file.name,
  file_date: creditFileDate,
}));


console.timeEnd("MAP_ROWS");
    



console.time("INSERT_CREDIT_DATA");

const CHUNK_SIZE = 3000;

for (
  let i = 0;
  i < allRecords.length;
  i += CHUNK_SIZE
) {

  console.time(`CHUNK_${i}`);

  const chunk = allRecords.slice(
    i,
    i + CHUNK_SIZE
  );

  const { error } = await supabase.rpc(
  "import_credit_data",
  {
    payload: chunk,
  }
);
  console.timeEnd(`CHUNK_${i}`);

  if (error) {
  console.error(
    "IMPORT_ERROR",
    error
  );

  throw error;
}
}
console.timeEnd("INSERT_CREDIT_DATA");
const { data: user } = await supabase
  .from("app_users")
  .select("full_name")
  .eq("username", uploadedBy)
  .single();

const notificationResult = await supabase
  .from("notifications")
  .insert({
    username: null,
    title: "✅ Credit File Imported",
    message: `Credit file uploaded successfully by ${user?.full_name || uploadedBy}.`,
  })
  .select();
const vansInFile = [
  ...new Set(
    allRecords
      .map((x) => x.van_code)
      .filter(Boolean)
  ),
];

const { data: vanSubscriptions } =
  await supabase
    .from("push_subscriptions")
    .select("*")
    .in("van_code", vansInFile);

const { data: adminSubscriptions } =
  await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("van_code", "ADMIN");

const subscriptions = [
  ...(vanSubscriptions || []),
  ...(adminSubscriptions || []),
];
const uniqueSubscriptions =
  Array.from(
    new Map(
      subscriptions.map((row) => {

        const subscription =
          typeof row.subscription === "string"
            ? JSON.parse(row.subscription)
            : row.subscription;

        return [
          subscription.endpoint,
          row,
        ];

      })
    ).values()
  );
console.time("PUSH_NOTIFICATIONS");

await Promise.all(
  uniqueSubscriptions.map(async (row) => {

    const subscription =
      typeof row.subscription === "string"
        ? JSON.parse(row.subscription)
        : row.subscription;

    try {
      const isAdmin = row.van_code === "ADMIN";

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: isAdmin
            ? "📘 Credit File Uploaded"
            : "✅ New Credit File Imported",

          body: isAdmin
            ? `${user?.full_name || uploadedBy} has successfully uploaded a Credit file.`
            : "A new credit file has been uploaded. Please review your blocked invoices.",

          url: isAdmin
            ? "https://credit-dashboard-fawn.vercel.app/van"
            : `/van/${row.van_code}`,
        })
      );
    } catch (error) {
      console.error("Credit push failed:", error);
    }
  })
);

console.timeEnd("PUSH_NOTIFICATIONS");
const vanCounts: Record<string, number> = {};

allRecords.forEach((row) => {

  const van =
    String(row.van_code || "").trim();

  if (!van) return;

  const centralInvoice =
    String(row.central_invoice || "")
      .trim()
      .toUpperCase();

  const invoiceStatus =
    String(row.invoice_status || "")
      .toLowerCase();

  if (
    centralInvoice !== "NOT CENTRAL"
  ) {
    return;
  }

  if (
    invoiceStatus.includes("legal")
  ) {
    return;
  }

  vanCounts[van] =
    (vanCounts[van] || 0) + 1;
});
const vanRows = Object.keys(vanCounts).map(
  (vanCode) => ({
    van_code: vanCode,
    invoice_count: vanCounts[vanCode],
    updated_at: new Date().toISOString(),
  })
);
console.time("UPSERT_COUNTS");
// await supabase
//   .from("van_invoice_counts")
//   .delete()
//   .neq("van_code", "");


await supabase
  .from("van_invoice_counts")
  .upsert(vanRows);

const permissionRows = Object.keys(vanCounts).map(
  (vanCode) => ({
    van_code: vanCode,
    is_unblocked: false,
    public_token: crypto.randomUUID(),
  })
);

await supabase
  .from("van_permissions")
  .upsert(permissionRows, {
    onConflict: "van_code",
  });

console.timeEnd("UPSERT_COUNTS");
console.timeEnd("TOTAL_IMPORT");

return NextResponse.json({
  success: true,
  rows: allRecords.length,
});
  } catch (err) {

  console.timeEnd("TOTAL_IMPORT");

  console.error("UPLOAD ERROR:", err);

    return NextResponse.json({
      success: false,
      error: String(err),
    });
  }
}