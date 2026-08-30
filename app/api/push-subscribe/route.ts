import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request
) {

  const body =
    await request.json();

  const { count } = await supabase
  .from("push_subscriptions")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("van_code", body.van_code);

if (
  body.van_code !== "ADMIN" &&
  (count || 0) >= 2
) {
  return NextResponse.json(
    {
      success: false,
      limitReached: true,
    },
    { status: 400 }
  );
}

const { error } = await supabase
  .from("push_subscriptions")
  .insert({
    van_code: body.van_code,
    subscription: body.subscription,
  });

if (body.van_code !== "ADMIN") {
  const { data: admins } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("van_code", "ADMIN");

  if (admins?.length) {
    const webpush = require("web-push");

    webpush.setVapidDetails(
      "mailto:admin@company.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    await Promise.allSettled(
      admins.map((admin) =>
        webpush.sendNotification(
          admin.subscription,
          JSON.stringify({
            title: "🔔 New Subscription",
            body: `Van ${body.van_code} subscribed to notifications`,
          })
        )
      )
    );
  }
}
  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });

}