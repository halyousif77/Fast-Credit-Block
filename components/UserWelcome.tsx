"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UserWelcome() {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const username =
        localStorage.getItem("currentUser");

      if (!username) return;

      const { data } = await supabase
        .from("app_users")
        .select("full_name")
        .eq("username", username)
        .single();

      if (data?.full_name) {
        setFullName(data.full_name);
      }
    };

    loadUser();
  }, []);

  if (!fullName) {
    return (
      <div className="flex items-center gap-3 text-white">
        <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center font-bold border border-white/20">
          ?
        </div>

        <div>
          <p className="text-xs text-blue-100">
            Not Signed In
          </p>

          <p className="font-semibold">
            Guest User
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-white">
      <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center font-bold shadow">
        {fullName.charAt(0).toUpperCase()}
      </div>

      <div>
        <p className="text-xs text-blue-100">
          Welcome Back
        </p>

        <p className="font-semibold text-base">
          {fullName}
        </p>
      </div>
    </div>
  );
}