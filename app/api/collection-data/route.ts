import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {

  let allInvoices: any[] = [];
  let from = 0;
  const batchSize = 1000;

  const { data: latestUpload } = await supabase
    .from("collection_uploads")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  while (true) {
    const { data: batch, error } = await supabase
      .from("collection_invoices")
      .select(
        "invoice, uploaded_by, created_at"
      )
      .range(from, from + batchSize - 1);

    if (error) {
      return NextResponse.json({
        invoices: [],
        fileInfo: "",
      });
    }

    if (!batch || batch.length === 0) {
      break;
    }

    allInvoices.push(...batch);

    if (batch.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  let fullName = "";

  if (latestUpload?.uploaded_by) {
    const { data: user } = await supabase
      .from("app_users")
      .select("full_name")
      .eq(
        "username",
        latestUpload.uploaded_by
      )
      .single();

    fullName =
      user?.full_name ||
      latestUpload.uploaded_by ||
      "Unknown";
  }

  const uploadTime =
    latestUpload?.created_at
      ? new Date(
          new Date(
            latestUpload.created_at
          ).getTime() +
            3 * 60 * 60 * 1000
        )
      : null;

  return NextResponse.json({
    invoices: allInvoices.map(
      (row: any) => row.invoice
    ),

    fileInfo:
      latestUpload
        ? `Uploaded By ${fullName} | ${uploadTime?.toLocaleString(
            "en-US",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }
          )}`
        : "",
  });
}