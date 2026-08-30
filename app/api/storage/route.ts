import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ value: null });
  }

  const { data } = await supabase
    .from("storage")
    .select("value")
    .eq("key", key)
    .single();

  return NextResponse.json({
    value: data?.value ?? null,
  });
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json();

  await supabase
    .from("storage")
    .upsert({
      key,
      value,
    });

  return NextResponse.json({
    success: true,
  });
}

export async function DELETE(req: NextRequest) {
  const { key } = await req.json();

  await supabase
    .from("storage")
    .delete()
    .eq("key", key);

  return NextResponse.json({
    success: true,
  });
}