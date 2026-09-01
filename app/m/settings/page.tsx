"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  LogIn,
  LogOut,
  Monitor,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { storage } from "@/utils/storage";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { useRegionFilter } from "@/lib/regionFilter";

export default function MobileSettingsPage() {
  const { t, lang, setLang, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const { allRegions, selectedRegions, setSelectedRegions } = useRegionFilter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    const user = await storage.getItem("currentUser");
    setIsLoggedIn(!!user);
    setCurrentUser(user || "");
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleLogin = async () => {
    setError("");

    const { data: user } = await supabase
      .from("app_users")
      .select("*")
      .eq("username", username)
      .single();

    if (!user) {
      setError(t("invalidUsername"));
      return;
    }

    if (user.password !== password) {
      setError(t("invalidPassword"));
      return;
    }

    await storage.setItem("currentUser", user.username);
    setUsername("");
    setPassword("");
    setShowLogin(false);
    refresh();
    window.dispatchEvent(new Event("user-changed"));
  };

  const handleLogout = async () => {
    await storage.removeItem("currentUser");
    refresh();
    window.dispatchEvent(new Event("user-changed"));
  };

  return (
    <div className="space-y-4">
      {/* Account */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase">
          {t("account")}
        </p>

        <div className="px-4 pb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">
              {isLoggedIn ? t("loggedInAs") : t("notLoggedIn")}
            </p>
            {isLoggedIn && (
              <p className="font-semibold text-[15px]">{currentUser}</p>
            )}
          </div>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl"
            >
              <LogOut size={15} />
              {t("logout")}
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 text-white text-sm font-medium px-4 py-2 rounded-xl"
              style={{ background: "#071d5c" }}
            >
              <LogIn size={15} />
              {t("login")}
            </button>
          )}
        </div>
      </section>

      {/* Region filter */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <p className="px-4 pt-4 text-xs font-semibold text-slate-400 uppercase">
          {t("regionFilter")}
        </p>
        <p className="px-4 pb-2 pt-1 text-xs text-slate-400">
          {t("regionFilterHint")}
        </p>

        <div className="pb-2">
          {allRegions.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-400">{t("noData")}</p>
          )}

          {allRegions.map((region) => {
            const checked = selectedRegions.includes(region);
            return (
              <button
                key={region}
                onClick={() =>
                  setSelectedRegions(
                    checked
                      ? selectedRegions.filter((r) => r !== region)
                      : [...selectedRegions, region]
                  )
                }
                className="w-full flex items-center justify-between px-4 py-3 border-t border-slate-50 first:border-t-0"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <MapPin size={15} className="text-slate-400" />
                  {region}
                </span>
                {checked && <Check size={18} style={{ color: "#071d5c" }} />}
              </button>
            );
          })}
        </div>

        {selectedRegions.length > 0 && (
          <button
            onClick={() => setSelectedRegions([])}
            className="w-full text-center text-sm text-red-600 font-medium py-3 border-t border-slate-50"
          >
            {t("clear")} ({t("allRegions")})
          </button>
        )}
      </section>

      {/* Language */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase">
          {t("language")}
        </p>

        <div className="pb-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className="w-full flex items-center justify-between px-4 py-3 border-t border-slate-50 first:border-t-0"
            >
              <span className="text-sm font-medium">{l.nativeLabel}</span>
              {lang === l.code && (
                <Check size={18} style={{ color: "#071d5c" }} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Admin tools */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase">
          {t("more")}
        </p>

        <Link
          href="/m/more"
          className="flex items-center justify-between px-4 py-3"
        >
          <span className="text-sm">
            {t("reports")} · {t("users")} · {t("logs")}
          </span>
          <Chevron size={16} className="text-slate-400" />
        </Link>
      </section>

      <Link
        href="/"
        onClick={() => sessionStorage.setItem("forceDesktop", "1")}
        className="flex items-center justify-center gap-2 text-sm text-slate-500 py-3"
      >
        <Monitor size={16} />
        {t("desktopSite")}
      </Link>

      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5">
            <p className="font-bold text-base mb-4">{t("login")}</p>

            <input
              placeholder={t("username")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-3"
            />
            <input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm mb-3"
            />

            {error && (
              <p className="text-red-600 text-xs mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleLogin}
                className="flex-1 text-white py-3 rounded-xl font-medium text-sm"
                style={{ background: "#071d5c" }}
              >
                {t("login")}
              </button>
              <button
                onClick={() => {
                  setShowLogin(false);
                  setError("");
                }}
                className="px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-600"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
