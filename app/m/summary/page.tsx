"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The summary content now lives directly on the "Van" tab (/m/van) so it's
// not buried inside "More" anymore. This route is kept only so old links or
// bookmarks still land somewhere useful.
export default function MobileSummaryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/m/van");
  }, [router]);

  return null;
}
