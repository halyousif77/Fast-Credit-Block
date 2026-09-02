"use client";

import { Smartphone, Filter, Globe } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import UserWelcome from "@/components/UserWelcome";
import { useI18n, LANGUAGES } from "@/lib/i18n";

export default function Header() {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();

  const [showLangMenu, setShowLangMenu] = useState(false);

  // Login/Logout already lives in each page's sidebar, so it's intentionally
  // not duplicated here.

  // The dedicated mobile app (/m/*) has its own header — hide the desktop one there.
  if (pathname.startsWith("/m")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#071d5c] to-[#0b2a7a] shadow-lg border-b border-blue-800">
        <div className="flex items-center justify-between px-6 py-3">
          <UserWelcome />

          <div className="flex items-center gap-3">
            {!pathname.startsWith("/van") && (
              <>
<button
  type="button"
  onClick={() => {
  window.location.href = "/m";
}}
  className="h-9 w-9 rounded-lg bg-blue-900 text-white hover:bg-blue-800 flex items-center justify-center"
  title={t("van")}
>
  <Smartphone size={20} strokeWidth={2} />
</button>

                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new Event("toggle-filters")
                    );
                  }}
                  className="h-9 w-9 rounded-lg bg-blue-900 text-white hover:bg-blue-800 flex items-center justify-center"
                  title={t("filters")}
                >
                  <Filter size={20} strokeWidth={2} />
                </button>
              </>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu((v) => !v)}
                className="h-9 w-9 rounded-lg bg-blue-900 text-white hover:bg-blue-800 flex items-center justify-center"
                title={t("language")}
              >
                <Globe size={20} strokeWidth={2} />
              </button>

              {showLangMenu && (
                <div className="absolute end-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-start px-4 py-2 text-sm hover:bg-slate-100 ${
                        lang === l.code
                          ? "font-bold text-blue-700"
                          : "text-slate-700"
                      }`}
                    >
                      {l.nativeLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NotificationBell />
          </div>
        </div>
      </header>
    </>
  );
}