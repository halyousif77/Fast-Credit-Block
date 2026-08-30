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

export async function POST(
  request: Request
) {
  try {

    const {
      van_code,
      requester,
      invoices,
    } = await request.json();

    const { data, error } =
      await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("van_code", "ADMIN");

    if (error) {
      throw error;
    }

    for (const row of data || []) {

      const subscription =
        typeof row.subscription ===
        "string"
          ? JSON.parse(
              row.subscription
            )
          : row.subscription;

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title:
            "🚚 Route Unblock Request",
          body:
            `Van ${van_code} requested unblock (${invoices} invoices remaining)`,
          url: `/van/${van_code}`,
        })
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error: any) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}