const INTERNAL_URL =
  process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Блокировка/разблокировка учётной записи в GoTrue (запрет входа) */
export async function gotrueBan(userId: string, ban: boolean) {
  const res = await fetch(
    `${INTERNAL_URL}/auth/v1/admin/users/${userId}/${ban ? "ban" : "unban"}`,
    {
      method: "POST",
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`GoTrue ${ban ? "ban" : "unban"} failed: ${res.status}`);
  }
}