"use client";

import { useEffect, useState } from "react";

export default function NotificationsAdmin() {
  const [enabled, setEnabled] =
    useState(false);

  function urlBase64ToUint8Array(
    base64String: string
  ) {
    const padding =
      "=".repeat(
        (4 - (base64String.length % 4)) % 4
      );

    const base64 =
      (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData =
      window.atob(base64);

    return Uint8Array.from(
      [...rawData].map((char) =>
        char.charCodeAt(0)
      )
    );
  }

  useEffect(() => {
    const checkSubscription =
      async () => {
        if (
          !(
            "serviceWorker" in navigator
          )
        )
          return;

        const registration =
          await navigator.serviceWorker.getRegistration();

        if (!registration) return;

setEnabled(false);
      };

    checkSubscription();
  }, []);

  const subscribe = async () => {
    try {
      const permission =
        await Notification.requestPermission();

      if (
        permission !== "granted"
      ) {
        alert(
          "Notifications permission denied"
        );
        return;
      }

      const registration =
        await navigator.serviceWorker.register(
          "/sw.js"
        );

      await navigator.serviceWorker.ready;

      const oldSubscription =
        await registration.pushManager.getSubscription();

      if (oldSubscription) {
        await oldSubscription.unsubscribe();
      }

      const subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(
              process.env
                .NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
        });

      const response =
        await fetch(
          "/api/push-subscribe",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
  van_code: "ADMIN",
  subscription,
}),          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to subscribe"
        );
      }

      setEnabled(true);

      alert(
        "✅ Admin notifications enabled"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Failed to enable notifications"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-2xl font-bold mb-6">
          Admin Notifications
        </h1>

        <button
          onClick={subscribe}
          disabled={enabled}
          className={`px-6 py-3 rounded-lg text-white font-semibold ${
            enabled
              ? "bg-green-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {enabled
            ? "✅ Notifications Enabled"
            : "🔔 Enable Notifications"}
        </button>
      </div>
    </div>
  );
}