import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
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