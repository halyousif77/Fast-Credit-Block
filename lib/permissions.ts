import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Import/exception write access:
 * - must be a known app user
 * - Yasser is explicitly blocked
 */
export async function canWriteData(username: string | null | undefined) {
  const value = String(username || "").trim();
  if (!value) return false;

  const { data, error } = await supabase
    .from("app_users")
    .select("username, full_name")
    .ilike("username", value)
    .maybeSingle();

  if (error || !data) return false;

  const usernameLower = String(data.username || "").trim().toLowerCase();
  const fullNameLower = String(data.full_name || "").trim().toLowerCase();
  if (usernameLower === "yasser" || fullNameLower === "yasser") return false;

  return true;
}
