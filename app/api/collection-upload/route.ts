import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

const path = String(body.path || "");

const uploadedBy = String(body.uploadedBy || "");

const originalName = String(body.originalName || "");

if (!path) {
  return NextResponse.json({
    success: false,
    error: "No file uploaded",
  });
}

const { data: storageFile, error: storageError } =
  await supabase.storage
    .from("imports")
    .download(path);

if (storageError || !storageFile) {
  throw storageError;
}

const buffer = Buffer.from(
  await storageFile.arrayBuffer()
);

    const workbook = XLSX.read(buffer, {
      type: "buffer",
    });

    const sheetName =
      workbook.SheetNames[0];

    const worksheet =
      workbook.Sheets[sheetName];

    const rows: any[] =
  XLSX.utils.sheet_to_json(
    worksheet,
    {
      header: 1,
    }
  );


const invoices = rows
  .slice(1)
  .filter((row: any) => {
    const status = String(row[26] || "")
      .trim()
      .toLowerCase();

    return (
      status === "hold" ||
      status === "completed"
    );
  })
  .map((row: any) => ({
    invoice: String(row[1] || "")
      .trim()
      .replace(/\s/g, "")
      .toUpperCase(),

    organization_code:
      String(row[11] || "").trim(),

    organization_name:
      String(row[12] || "").trim(),

    customer_code:
      String(row[16] || "").trim(),

    customer_name:
      String(row[17] || "").trim(),

    region:
      String(row[22] || "").trim(),

    city:
      String(row[23] || "").trim(),
  }))
  .filter(
    (row: any) => row.invoice
  );

    const { data: uploadRecord, error: uploadError } =
  await supabase
    .from("collection_uploads")
    .insert({
      file_name: originalName,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

if (uploadError) {
  throw uploadError;
}

const records = invoices.map(
  (item) => ({
    invoice: item.invoice,

    organization_code:
      item.organization_code,

    organization_name:
      item.organization_name,

    customer_code:
      item.customer_code,

    customer_name:
      item.customer_name,

    region:
      item.region,

    city:
      item.city,

    uploaded_by:
      uploadedBy,

    upload_id:
      uploadRecord.id,
  })
);
const { data: existingCollected } =
  await supabase
    .from("collection_invoices")
    .select("invoice");

const existingCollectedSet =
  new Set(
    (existingCollected || []).map(
      (row: any) =>
        String(row.invoice)
          .trim()
          .toUpperCase()
    )
  );
const recordsToInsert =
  records.filter(
    (record, index, self) =>
      index ===
      self.findIndex(
        r => r.invoice === record.invoice
      )
  );
const newlyCollectedInvoices =
  recordsToInsert
    .map(r => r.invoice)
    .filter(
      invoice =>
        !existingCollectedSet.has(invoice)
    );
for (
  let i = 0;
  i < recordsToInsert.length;
  i += 5000
) {
  const batch = recordsToInsert.slice(
    i,
    i + 5000
  );

    const { error } = await supabase
    .from("collection_invoices")
.insert(batch);

  if (error) {
    throw error;
  }
}
const { data: user } = await supabase
  .from("app_users")
  .select("full_name")
  .eq("username", uploadedBy)
  .single();
const { data: adminSubscriptions } =
  await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("van_code", "ADMIN");

await Promise.all(
  (adminSubscriptions || []).map(
    async (row: any) => {
      const subscription =
        typeof row.subscription === "string"
          ? JSON.parse(row.subscription)
          : row.subscription;

      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: "📗 Collection File Uploaded",
            body: `${user?.full_name || uploadedBy} has successfully uploaded a Collection file.`,
            url: "https://credit-dashboard-fawn.vercel.app/van",
          })
        );
      } catch (error) {
        console.error(
          "Admin collection push failed:",
          error
        );
      }
    }
  )
);
await supabase
  .from("notifications")
  .insert({
    username: null,
    title: "📦 Collection File Imported",
    message: `Collection ${uploadRecord.id} uploaded successfully by ${user?.full_name || uploadedBy}.`,
  });

const previousUploadId =
  uploadRecord.id - 1;

if (previousUploadId > 0) {

  const { data: previousInvoices } =
    await supabase
      .from("collection_invoices")
      .select("invoice")
      .eq(
        "upload_id",
        previousUploadId
      );

  const previousSet = new Set(
    (previousInvoices || []).map(
      (r: any) =>
        String(r.invoice)
          .trim()
          .toUpperCase()
    )
  );

  const currentSet = new Set(
    recordsToInsert.map(
      (r: any) =>
        String(r.invoice)
          .trim()
          .toUpperCase()
    )
  );

  const disappearedInvoices =
    [...previousSet].filter(
      invoice =>
        !currentSet.has(invoice)
    );

  if (disappearedInvoices.length > 0) {

    await supabase
      .from("notifications")
      .insert({
        username: null,
        title:
          "🚨 Disappeared Invoice Alert",
        message:
          `${disappearedInvoices.length} invoice(s) disappeared from Collection ${uploadRecord.id}.`,
        is_read: false,
      });

  }

}

const affectedInvoices =
  newlyCollectedInvoices;

const { data: affectedCreditRows } =
  await supabase
    .from("credit_data_full")
    .select("invoice, van_code")
    .in("invoice", affectedInvoices);

const affectedVans = [
  ...new Set(
    (affectedCreditRows || [])
      .map((row: any) => row.van_code)
      .filter(Boolean)
  ),
];
const collectedPerVan: Record<string, number> = {};

(affectedCreditRows || []).forEach(
  (row: any) => {

    const vanCode = String(
      row.van_code || ""
    ).trim();

    if (!vanCode) return;

    collectedPerVan[vanCode] =
      (collectedPerVan[vanCode] || 0) + 1;

  }
);
const currentCounts: Record<string, number> = {};

const { data: allCollected } =
  await supabase
    .from("collection_invoices")
    .select("invoice");

const collectedSet = new Set(
  (allCollected || []).map((row: any) =>
    String(row.invoice)
      .trim()
      .toUpperCase()
  )
);

const { data: creditRows } =
  await supabase
    .from("credit_data_full")
    .select(`
      invoice,
      van_code,
      central_invoice,
      invoice_status
    `);
(creditRows || []).forEach(
  (row: any) => {

    const vanCode = String(
      row.van_code || ""
    ).trim();

    if (!vanCode) return;

    const invoice = String(
      row.invoice || ""
    )
      .trim()
      .toUpperCase();

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

    if (collectedSet.has(invoice))
      return;

    currentCounts[vanCode] =
      (currentCounts[vanCode] || 0) + 1;

  }
);
  const { data: savedCounts } =
  await supabase
    .from("van_invoice_counts")
    .select("van_code, invoice_count");

const savedCountsMap = new Map(
  (savedCounts || []).map((row: any) => [
    row.van_code,
    row.invoice_count,
  ])
);
const { data: allSubscriptions } =
  await supabase
    .from("push_subscriptions")
    .select("*");

const subscriptionsMap = new Map();

(allSubscriptions || []).forEach(
  (row: any) => {

    const vanCode =
      String(row.van_code || "");

    if (!subscriptionsMap.has(vanCode)) {
      subscriptionsMap.set(vanCode, []);
    }

    subscriptionsMap
      .get(vanCode)
      .push(row);

  }
);
for (const vanCode of affectedVans) {

  const newCount =
    currentCounts[vanCode] || 0;

  const oldCount =
  savedCountsMap.get(vanCode);


const reducedBy =
  collectedPerVan[vanCode] || 0;

if (reducedBy > 0)
{

  const subscriptions =
  subscriptionsMap.get(vanCode) || [];

  await Promise.all(
  (subscriptions || []).map(
    async (row: { subscription: any }) => {

        const subscription =
          typeof row.subscription === "string"
            ? JSON.parse(
                row.subscription
              )
            : row.subscription;

        try {

          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: "✅ Collection Updated",
body: `${reducedBy} invoice(s) collected from van ${vanCode}.`,
              url: `/van/${vanCode}`,
            })
          );

        } catch (error) {

          console.error(error);

        }

      }
    )
  );

}    
  await supabase
    .from("van_invoice_counts")
    .upsert({
      van_code: vanCode,
      invoice_count: newCount,
      updated_at:
        new Date().toISOString(),
    });

}
    return NextResponse.json({
      success: true,
      invoices: invoices.length,
      file: originalName,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: String(error),
    });
  }
}