"use client";

import Link from "next/link";
import { Smartphone, Filter, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { storage as localStorage } from "@/utils/storage";
import NotificationBell from "@/components/NotificationBell";
import UserWelcome from "@/components/UserWelcome";
import { useI18n, LANGUAGES } from "@/lib/i18n";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang } = useI18n();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const user = await localStorage.getItem("currentUser");
      setIsLoggedIn(!!user);
    };

    loadUser();
  }, []);

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
  window.location.href = "/van";
}}
  className="h-9 w-9 rounded-lg bg-blue-900 text-white hover:bg-blue-800 flex items-center justify-center"
  title="Van"
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
                  title="Filters"
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

            {isLoggedIn ? (
              <button
                onClick={async () => {
                  await localStorage.removeItem("currentUser");
                  setIsLoggedIn(false);
                  window.location.reload();
                }}
                className="h-9 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm"
              >
                {t("logout")}
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="h-9 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                {t("login")}
              </button>
            )}

            <NotificationBell />
          </div>
        </div>
      </header>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white p-6 rounded-2xl w-80">
            <input
              type="text"
              placeholder={t("username")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border p-3 rounded-lg mb-3"
            />

            <input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-3 rounded-lg mb-3"
            />

            {loginError && (
              <p className="text-red-600 text-sm mb-3">{loginError}</p>
            )}

            <div className="flex gap-2">
              <button
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                onClick={async () => {
                  setLoginError("");

                  const { data: user } = await supabase
                    .from("app_users")
                    .select("*")
                    .eq("username", username)
                    .single();

                  if (!user) {
                    setLoginError(t("invalidUsername"));
                    return;
                  }

                  if (user.password !== password) {
                    setLoginError(t("invalidPassword"));
                    return;
                  }

                  await localStorage.setItem(
                    "currentUser",
                    user.username
                  );

                  setIsLoggedIn(true);
                  setShowLoginModal(false);
                  setUsername("");
                  setPassword("");

                  window.dispatchEvent(
                    new Event("user-changed")
                  );
                }}
              >
                {t("login")}
              </button>

              <button
                className="px-4 py-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError("");
                }}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}