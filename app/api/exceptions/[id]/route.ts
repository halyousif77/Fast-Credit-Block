import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } =
    await context.params;

  let requestedBy = "";
  try {
    const body = await request.json();
    requestedBy = body?.requestedBy || "";
  } catch {
    // no body sent
  }

  const { data: existing, error: fetchError } =
    await supabase
      .from("exceptions")
      .select("created_by")
      .eq("id", id)
      .maybeSingle();

  if (fetchError) {
    return NextResponse.json({
      success: false,
      error: fetchError.message,
    });
  }

  if (!existing) {
    return NextResponse.json({
      success: false,
      error: "Exception not found",
    });
  }

  if (!requestedBy || existing.created_by !== requestedBy) {
    return NextResponse.json(
      {
        success: false,
        error: "You can only delete exceptions you added",
      },
      { status: 403 }
    );
  }

  const { error } =
    await supabase
      .from("exceptions")
      .delete()
      .eq("id", id);

  return NextResponse.json({
    success: !error,
    error: error?.message,
  });
}