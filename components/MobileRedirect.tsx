"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Small screens land on the dedicated /m/* mobile experience automatically.
// /van keeps working as-is (it's the driver/rep app, already mobile-built).
const EXCLUDED_PREFIXES = ["/m", "/van", "/api"];

export default function MobileRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Once inside the mobile app, drop any earlier "view desktop" override.
    if (pathname.startsWith("/m")) {
      sessionStorage.removeItem("forceDesktop");
      return;
    }

    if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return;

    if (sessionStorage.getItem("forceDesktop") === "1") return;

    const isMobile = window.matchMedia("(max-width: 820px)").matches;

    if (isMobile) {
      router.replace("/m");
    }
  }, [pathname, router]);

  return null;
}
