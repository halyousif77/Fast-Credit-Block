import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addLog } from "@/lib/activityLog";

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

export async function GET() {
await supabase
  .from("notifications")
  .delete()
  .lt(
    "created_at",
    new Date(
      Date.now() -
      30 * 24 * 60 * 60 * 1000
    ).toISOString()
  );
  const today = new Date();

today.setHours(
  today.getHours() + 3
);

const todayDate =
  today.toISOString().split("T")[0];

 // حذف جميع الاستثناءات المنتهية
const { data: expiredExceptions } =
  await supabase
    .from("exceptions")
    .select("*")
    .lt("till_date", todayDate);

if (expiredExceptions?.length) {

  const notifications = [];

  for (const item of expiredExceptions) {

    const { data: settings } =
      await supabase
        .from("user_settings")
        .select("exception_expired_alert")
        .eq("username", item.created_by)
        .single();

    if (
      settings?.exception_expired_alert !== false
    ) {

      notifications.push({
        username: item.created_by,
        title: "⌛ Exception Expired",
        message:
          `Exception invoice ${item.invoice} has expired.`,
      });

    }

  }

  if (notifications.length) {

  await supabase
    .from("notifications")
    .insert(notifications);

}

// إرسال Push Notification للموبايل
for (const item of expiredExceptions) {

  const { data: subscriptions } =
    await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("van_code", item.van_code);

  for (const row of subscriptions || []) {
    try {

      const subscription =
        typeof row.subscription === "string"
          ? JSON.parse(row.subscription)
          : row.subscription;

      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: "⌛ Exception Expired",
          body:
  `Invoice: ${item.invoice}
Customer: ${item.customer_code} - ${item.customer_name}
Exception expired and was removed.`,
          url: `/van/${item.van_code}/exceptions`,
        })
      );

    } catch (sendError) {
      console.error(
        "EXPIRED PUSH ERROR",
        sendError
      );
    }
  }

  await addLog(
    "SYSTEM",
    "Automated Maintenance Service",
    "DELETE_EXCEPTION",
    `Expired exception removed: ${item.invoice}`
  );
}

await supabase
  .from("exceptions")
  .delete()
  .lt("till_date", todayDate);

}  // جلب الاستثناءات الحالية

  const { data } =
    await supabase
      .from("exceptions")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

  return NextResponse.json(
    data || []
  );
}
export async function POST(
  request: Request
) {

  const body =
    await request.json();

  const { error } =
    await supabase
      .from("exceptions")
      .insert(body);

  return NextResponse.json({
    success: !error,
    error: error?.message,
  });
}