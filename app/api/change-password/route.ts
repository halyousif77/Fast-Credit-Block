import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    currentPassword,
    newPassword,
  } = body;

  return NextResponse.json({
    success: true,
  });
}