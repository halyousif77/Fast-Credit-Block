import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addLog } from "@/lib/activityLog";
import { canWriteData } from "@/lib/permissions";

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
  try {
    const body = await request.json();

    // Desktop sends multiple exceptions as an array, while mobile sends
    // one exception as an object. Normalize both formats before checking
    // permissions.
    const rows = Array.isArray(body) ? body : [body];

    if (!rows.length || rows.some((row) => !row || typeof row !== "object")) {
      return NextResponse.json(
        { success: false, error: "Invalid exception data" },
        { status: 400 }
      );
    }

    const createdBy = String(rows[0]?.created_by || "").trim();

    // Guests and Yasser are blocked here on the server as well, so this
    // rule cannot be bypassed by calling the API directly.
    if (!(await canWriteData(createdBy))) {
      return NextResponse.json(
        { success: false, error: "You are not allowed to add exceptions" },
        { status: 403 }
      );
    }

    // Do not allow a mixed-user payload. Every exception in one request
    // must belong to the same authorized user.
    const mixedUser = rows.some(
      (row) => String(row.created_by || "").trim() !== createdBy
    );

    if (mixedUser) {
      return NextResponse.json(
        { success: false, error: "Invalid exception creator" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("exceptions")
      .insert(rows);

    if (error) {
      console.error("EXCEPTION INSERT ERROR", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to save exception" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("EXCEPTION POST ERROR", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to save exception",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const body = await request.json();

    const id = Number(body.id);
    const invoice = String(body.invoice || "")
      .trim()
      .replace(/\s/g, "")
      .toUpperCase();
    const tillDate = String(body.till_date || "").trim();
    const updatedBy = String(body.updatedBy || "").trim();

    if (!(await canWriteData(updatedBy))) {
      return NextResponse.json(
        { success: false, error: "You are not allowed to edit exceptions" },
        { status: 403 }
      );
    }

    if (!id || !invoice || !updatedBy) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Only the user who created the exception may edit it.
    const { data: existing, error: existingError } = await supabase
      .from("exceptions")
      .select("id, invoice, created_by, permanent, till_date")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { success: false, error: "Exception not found" },
        { status: 404 }
      );
    }

    if (String(existing.created_by || "") !== updatedBy) {
      return NextResponse.json(
        { success: false, error: "You can only edit exceptions you added" },
        { status: 403 }
      );
    }

    const updateData: Record<string, any> = {
      invoice,
    };

    // Legal/permanent exceptions do not require a Till Date.
    if (!existing.permanent) {
      if (!tillDate) {
        return NextResponse.json(
          { success: false, error: "Till Date is required" },
          { status: 400 }
        );
      }
      updateData.till_date = tillDate;
    }

    const { data: updated, error: updateError } = await supabase
      .from("exceptions")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Unexpected Error" },
      { status: 500 }
    );
  }
}
