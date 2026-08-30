import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request
) {
  const { searchParams } =
    new URL(request.url);

  const vanCode =
    searchParams.get("van_code");

  const { count } = await supabase
    .from("push_subscriptions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("van_code", vanCode);

  return NextResponse.json({
    hidden: (count || 0) >= 2,
  });
}