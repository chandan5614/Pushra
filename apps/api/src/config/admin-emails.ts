export function isAdminEmail(email?: string, adminEnv = process.env.ADMIN_EMAILS): boolean {
  if (!email || !adminEnv) return false
  const list = adminEnv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}
