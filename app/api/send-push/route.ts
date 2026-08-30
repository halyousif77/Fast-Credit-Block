import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { van_code } = await request.json();

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("van_code", van_code);

    if (error) {
      throw error;
    }

    for (const row of data || []) {
      const subscription =
        typeof row.subscription === "string"
          ? JSON.parse(row.subscription)
          : row.subscription;

      console.log(
        "Subscription endpoint:",
        subscription.endpoint
      );

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: "✅ Route Unblocked",
          body: `Van ${van_code} is now unblocked.`,
          url: `/van/${van_code}`,
        })
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}