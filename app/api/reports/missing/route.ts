import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {

  const { data: uploads } = await supabase
    .from("collection_uploads")
    .select("*")
    .order("created_at", {
      ascending: true,
    });

  if (!uploads || uploads.length < 2) {
    return NextResponse.json([]);
  }

  const results: any[] = [];

  for (let i = 0; i < uploads.length - 1; i++) {

    const currentUpload =
      uploads[i];

    const nextUpload =
      uploads[i + 1];

    const { data: currentInvoices } =
      await supabase
        .from("collection_invoices")
        .select("invoice")
        .eq(
          "upload_id",
          currentUpload.id
        );

    const { data: nextInvoices } =
      await supabase
        .from("collection_invoices")
        .select("invoice")
        .eq(
          "upload_id",
          nextUpload.id
        );

    const nextSet = new Set(
      (nextInvoices || []).map(
        (x: any) =>
          String(x.invoice)
            .trim()
            .toUpperCase()
      )
    );

    for (const row of currentInvoices || []) {

      const invoice =
        String(row.invoice)
          .trim()
          .toUpperCase();

      if (!nextSet.has(invoice)) {

const { data: collectionRow } =
  await supabase
    .from("collection_invoices")
    .select(`
      invoice,
      region,
      city,
      organization_code,
      organization_name
    `)
    .eq(
      "invoice",
      invoice
    )
    .eq(
      "upload_id",
      currentUpload.id
    )
    .maybeSingle();

results.push({
  region:
    collectionRow?.region || "",

  city:
    collectionRow?.city || "",

  organization_code:
    collectionRow?.organization_code || "",

  organization_name:
    collectionRow?.organization_name || "",

  invoice,

  first_seen:
    currentUpload.id,

  missing_from:
    nextUpload.id,
});

      }

    }

  }

  return NextResponse.json(
    results
  );

}