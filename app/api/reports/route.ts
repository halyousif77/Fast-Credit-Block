import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {

  const { data: creditData, error } =
    await supabase
      .from("credit_data_full")
      .select(`
        region,
        city,
        van_code,
        employee_name,
        employee_ats_code,
        customer_code,
        customer_name,
        central_invoice,
        payment_term,
        invoice,
        trx_date,
        credit_invoice_amount,
        pending_cim,
        credit_days,
        invoice_status,
        status_user_block,
        total_rejected_count
      `);

  console.log("ERROR:", error);
  console.log("ROWS:", creditData?.length);

  const { data: collections } =
    await supabase
      .from("collection_uploads")
      .select("*")
      .order("created_at", {
        ascending: true,
      });

  return NextResponse.json({
    creditData: creditData || [],
    collections: collections || [],
  });

}