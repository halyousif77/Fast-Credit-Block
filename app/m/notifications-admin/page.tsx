"use client";
import { apiFetch as fetch } from "@/lib/apiCache";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function MobileNotificationsAdminPage() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      const sub = await registration.pushManager.getSubscription();
      setEnabled(!!sub);
    })();
  }, []);

  const subscribe = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications permission denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const oldSubscription = await registration.pushManager.getSubscription();
      if (oldSubscription) await oldSubscription.unsubscribe();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const response = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ van_code: "ADMIN", subscription }),
      });

      if (!response.ok) throw new Error("Failed to subscribe");

      setEnabled(true);
      toast.success("Admin notifications enabled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to enable notifications");
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => router.push("/m/more")}
        className="flex items-center gap-1.5 text-sm text-slate-500 mb-1"
      >
        <Back size={16} />
        {t("back")}
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center gap-4">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center text-white"
          style={{ background: enabled ? "#16a34a" : "#071d5c" }}
        >
          {enabled ? <BellRing size={26} /> : <Bell size={26} />}
        </div>

        <button
          onClick={subscribe}
          disabled={enabled}
          className={`px-5 py-3 rounded-xl text-white font-semibold text-sm ${
            enabled ? "bg-green-600" : ""
          }`}
          style={!enabled ? { background: "#071d5c" } : undefined}
        >
          {enabled ? "✅ Notifications Enabled" : "🔔 Enable Notifications"}
        </button>
      </div>
    </div>
  );
}
