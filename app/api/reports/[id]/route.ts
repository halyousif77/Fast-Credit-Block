import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {

  const { id } =
    await context.params;

  const { data, error } =
    await supabase
      .from("collection_invoices")
      .select("*")
      .eq("upload_id", Number(id));

  if (error) {
    return NextResponse.json([]);
  }

  return NextResponse.json(data);

}