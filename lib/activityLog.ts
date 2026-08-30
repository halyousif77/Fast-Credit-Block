import { supabase } from "@/lib/supabase";

export async function addLog(
  username: string,
  fullName: string,
  action: string,
  details: string
) {
  await supabase
    .from("activity_logs")
    .insert({
      username,
      full_name: fullName,
      action,
      details,
    });
}