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
    const {
  van_code,
  count,
  invoice,
  customer_code,
  customer_name,
  days,
} = await request.json();


    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("van_code", van_code);

    if (error) {
      console.error(
        "SUBSCRIPTION ERROR",
        error
      );

      throw error;
    }

    console.log(
      "SUBSCRIPTIONS FOUND:",
      data?.length || 0
    );

    for (const row of data || []) {
      try {
        const subscription =
          typeof row.subscription ===
          "string"
            ? JSON.parse(
                row.subscription
              )
            : row.subscription;

        console.log(
          "SENDING TO:",
          subscription.endpoint
        );

        const result =
          await webpush.sendNotification(
  subscription,
  JSON.stringify({
title: "⚠️ New Exception",

body:
  `Invoice: ${invoice}
Customer: ${customer_code} - ${customer_name}
Duration: ${days}
Total Exceptions: ${count}`,
    url: `/van/${van_code}/exceptions`,
  })
);

        console.log(
          "NOTIFICATION SENT",
          result?.statusCode
        );
      } catch (sendError) {
        console.error(
          "SEND ERROR",
          sendError
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error(
      "API ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}