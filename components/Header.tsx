"use client";

import Link from "next/link";
import { Smartphone, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { storage as localStorage } from "@/utils/storage";
import NotificationBell from "@/components/NotificationBell";
import UserWelcome from "@/components/UserWelcome";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const user = await localStorage.getItem("currentUser");
      setIsLoggedIn(!!user);
    };

    loadUser();
  }, []);

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

            {pathname.startsWith("/van") &&
              (isLoggedIn ? (
                <button
                  onClick={async () => {
                    await localStorage.removeItem("currentUser");
                    setIsLoggedIn(false);
                    window.location.reload();
                  }}
                  className="h-9 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="h-9 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Login
                </button>
              ))}

            <NotificationBell />
          </div>
        </div>
      </header>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-80">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border p-3 rounded-lg mb-3"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-3 rounded-lg mb-3"
            />

            <button
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
              onClick={async () => {
                const { data: user } = await supabase
                  .from("app_users")
                  .select("*")
                  .eq("username", username)
                  .single();

                if (!user) {
                  alert("Invalid Username");
                  return;
                }

                if (user.password !== password) {
                  alert("Invalid Password");
                  return;
                }

                await localStorage.setItem(
                  "currentUser",
                  user.username
                );

                setIsLoggedIn(true);
                setShowLoginModal(false);

                window.dispatchEvent(
                  new Event("user-changed")
                );
              }}
            >
              Login
            </button>
          </div>
        </div>
      )}
    </>
  );
}