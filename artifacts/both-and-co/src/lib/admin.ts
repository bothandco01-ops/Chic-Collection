type ClerkUserLike = {
  publicMetadata?: { role?: unknown } & Record<string, unknown>;
  primaryEmailAddress?: { emailAddress?: string } | null;
  emailAddresses?: Array<{ emailAddress?: string }>;
} | null | undefined;

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export function isUserAdmin(user: ClerkUserLike): boolean {
  if (!user) return false;
  if (user.publicMetadata?.role === "admin") return true;
  const emails: string[] = [];
  if (user.primaryEmailAddress?.emailAddress) {
    emails.push(user.primaryEmailAddress.emailAddress.toLowerCase());
  }
  if (Array.isArray(user.emailAddresses)) {
    for (const e of user.emailAddresses) {
      if (e?.emailAddress) emails.push(e.emailAddress.toLowerCase());
    }
  }
  if (emails.some((e) => ADMIN_EMAILS.includes(e))) return true;
  return false;
}
