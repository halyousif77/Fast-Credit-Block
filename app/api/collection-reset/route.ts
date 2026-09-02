import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canWriteData } from "@/lib/permissions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  let requestedBy = "";
  try {
    const body = await req.json();
    requestedBy = String(body?.requestedBy || "").trim();
  } catch {}

  if (!(await canWriteData(requestedBy))) {
    return NextResponse.json({ success: false, error: "You are not allowed to reset collection data" }, { status: 403 });
  }
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
  const { error: invoicesError } =
    await supabase
      .from("collection_invoices")
      .delete()
      .neq("invoice", "");

  if (invoicesError) {
    return NextResponse.json(
      { error: invoicesError.message },
      { status: 500 }
    );
  }

  const { error: uploadsError } =
    await supabase
      .from("collection_uploads")
      .delete()
      .gt("id", 0);

  if (uploadsError) {
    return NextResponse.json(
      { error: uploadsError.message },
      { status: 500 }
    );
  }

  const { error: countsError } =
    await supabase
      .from("van_invoice_counts")
      .delete()
      .neq("van_code", "");

  if (countsError) {
    return NextResponse.json(
      { error: countsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });

}