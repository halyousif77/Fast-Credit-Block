"use client";
import { apiFetch as fetch } from "@/lib/apiCache";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BellDot } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export default function NotificationBell() {
  const { t, dir, lang } = useI18n();

  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] =
    useState<any[]>([]);
const [creditAlert, setCreditAlert] =
  useState(false);
  const pathname = usePathname();

if (pathname.startsWith("/van")) {
  return null;
}

  const loadNotifications = async () => {

  const username =
    localStorage.getItem("currentUser");

  if (!username) return;

  const saudiNow = new Date(
    new Date().toLocaleString(
      "en-US",
      {
        timeZone: "Asia/Riyadh",
      }
    )
  );

  const saudiTodayStart =
    new Date(
      saudiNow.getFullYear(),
      saudiNow.getMonth(),
      saudiNow.getDate(),
      0,
      0,
      0,
      0
    );

  await supabase
    .from("notifications")
    .delete()
    .lt(
      "created_at",
      saudiTodayStart.toISOString()
    );

  const { data } = await supabase
  .from("notifications")
  .select("*")
  .or(
    `username.eq.${username},username.is.null`
  )
  .order("created_at", {
    ascending: false,
  });

const { data: settings } = await supabase
  .from("user_settings")
  .select("*")
  .eq("username", username)
  .single();

const creditResponse =
  await fetch("/api/credit-data");

const creditResult =
  await creditResponse.json();

const fileDate = String(
  creditResult.fileDate || ""
).slice(0, 10);

const saudiToday = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Riyadh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

setCreditAlert(fileDate !== saudiToday);

let filtered = data || [];

if (settings) {

  filtered = filtered.filter((n) => {

  if (
  n.title.toLowerCase().includes("credit") &&
  settings.credit_import_alert === false
) {
  return false;
}

if (
  n.title.toLowerCase().includes("collection") &&
  settings.collection_import_alert === false
) {
  return false;
}

if (
  n.title.toLowerCase().includes("disappeared") &&
  settings.invoice_disappeared_alert === false
) {
  return false;
}

if (
  n.title.toLowerCase().includes("exception") &&
  settings.exception_alert === false
) {
  return false;
}

if (
  n.title.toLowerCase().includes("credit") &&
  settings.credit_disabled_at &&
  new Date(n.created_at) <=
    new Date(settings.credit_disabled_at)
) {
  return false;
}

if (
  n.title.toLowerCase().includes("collection") &&
  settings.collection_disabled_at &&
  new Date(n.created_at) <=
    new Date(settings.collection_disabled_at)
) {
  return false;
}

if (
  n.title.toLowerCase().includes("disappeared") &&
  settings.disappeared_disabled_at &&
  new Date(n.created_at) <=
    new Date(settings.disappeared_disabled_at)
) {
  return false;
}

if (
  n.title.toLowerCase().includes("exception") &&
  settings.exception_disabled_at &&
  new Date(n.created_at) <=
    new Date(settings.exception_disabled_at)
) {
  return false;
}

    return true;

  });

}

setNotifications(filtered);
};

useEffect(() => {

  loadNotifications();

  const interval =
    setInterval(
      loadNotifications,
      5000
    );

  return () =>
    clearInterval(interval);

}, []);

  const localizeNotification = (n: any) => {
    if (lang === "en") return { title: n.title, message: n.message };

    const title = String(n.title || "");
    const message = String(n.message || "");
    const titleMap: Array<[string, string]> = [
      ["Credit File Imported", "تم استيراد ملف الائتمان"],
      ["Credit File Updated", "تم تحديث ملف الائتمان"],
      ["Users Imported", "تم استيراد المستخدمين"],
      ["Users File Imported", "تم استيراد ملف المستخدمين"],
      ["Collection File Uploaded", "تم رفع ملف التحصيل"],
      ["Collection File Imported", "تم استيراد ملف التحصيل"],
      ["Collection Updated", "تم تحديث التحصيل"],
      ["New Exception", "استثناء جديد"],
      ["Exception Expired", "انتهى الاستثناء"],
      ["Exceptions Added", "تمت إضافة الاستثناءات"],
      ["Exception Deleted", "تم حذف الاستثناء"],
    ];
    const messageMap: Array<[string, string]> = [
      ["Credit file uploaded successfully", "تم رفع ملف الائتمان بنجاح"],
      ["users imported successfully", "تم استيراد المستخدمين بنجاح"],
      ["Collection", "التحصيل"],
      ["uploaded successfully", "تم الرفع بنجاح"],
      ["added successfully", "تمت الإضافة بنجاح"],
      ["deleted successfully", "تم الحذف بنجاح"],
    ];

    let localizedTitle = title;
    for (const [from, to] of titleMap) {
      if (localizedTitle.toLowerCase().includes(from.toLowerCase())) {
        localizedTitle = localizedTitle.replace(new RegExp(from, "ig"), to);
        break;
      }
    }

    let localizedMessage = message;
    for (const [from, to] of messageMap) {
      localizedMessage = localizedMessage.replace(new RegExp(from, "ig"), to);
    }

    return { title: localizedTitle, message: localizedMessage };
  };

  const unreadCount =
  notifications.filter(
    (n) => !n.is_read
  ).length +
  (creditAlert ? 1 : 0);
  return (
    <div className="relative">

<button
  onClick={async () => {
    const nextState = !open;

    setOpen(nextState);

    if (nextState) {
      const username =
        localStorage.getItem("currentUser");

      if (username) {
        await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .or(
            `username.eq.${username},username.is.null`
          );

        loadNotifications();
      }
    }
  }}
  className={`
  relative
  flex
  items-center
  justify-center
  w-11
  h-11
  rounded-xl
  bg-white/10
  hover:bg-white/20
  text-white
  transition-all
  duration-200
  ${creditAlert ? "animate-shake" : ""}
`}
>
  <BellDot size={22} />

  {unreadCount > 0 && (
    <span
      className="
        absolute
        -top-1
        -right-1
        bg-red-500
        text-white
        text-[10px]
        rounded-full
        min-w-[18px]
        h-[18px]
        px-1
        flex
        items-center
        justify-center
        font-bold
      "
    >
      {unreadCount}
    </span>
  )}
</button>
      {open && (

        <div
  className="
    fixed
    top-16
    w-[min(420px,calc(100vw-2rem))]
    max-w-[calc(100vw-2rem)]
    max-h-[calc(100vh-5rem)]
    overflow-hidden
    bg-white
    border
    rounded-xl
    shadow-xl
    z-[9999]
  "
  style={{
    [dir === "rtl" ? "right" : "left"]: "1rem",
  }}
>
          <div className="p-4 border-b">
            <h3 className="font-bold">
  {t("notifications")} (
  {notifications.length +
    (creditAlert ? 1 : 0)}
)
</h3>
          </div>

          <div className="max-h-80 overflow-auto">

  {creditAlert && (
    <div className="p-4 border-b bg-red-50 sticky top-0 z-10">
      <div className="font-bold text-red-700">
        {t("creditFileNotUpdated")}
      </div>

      <div className="text-sm text-red-600 mt-1">
        {t("uploadTodayCredit")}
      </div>
    </div>
  )}

  {notifications.length === 0 ? (
              <p className="p-4 text-gray-500">
                {t("noNotifications")}
              </p>

            ) : (

              notifications.map((n) => (

                <div
  key={n.id}
  className={`p-4 border-b transition ${
    !n.is_read
      ? "bg-blue-50"
      : "hover:bg-slate-50"
  }`}
>
  <div className="font-semibold text-slate-800">
    {localizeNotification(n).title}
  </div>

  <div className="text-sm text-slate-500 mt-1">
    {localizeNotification(n).message}
  </div>

  <div className="text-xs text-slate-400 mt-2">
    {new Date(n.created_at).toLocaleString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    )}
  </div>
</div>
              ))

            )}

          </div>

        </div>

      )}

    </div>
  );
}
