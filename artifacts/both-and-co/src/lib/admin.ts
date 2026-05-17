type ClerkUserLike = {
  publicMetadata?: { role?: unknown } & Record<string, unknown>;
  primaryEmailAddress?: { emailAddress?: string } | null;
  emailAddresses?: Array<{ emailAddress?: string }>;
} | null | undefined;

const ENV_ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

function getUserEmails(user: ClerkUserLike): string[] {
  if (!user) return [];
  const emails: string[] = [];
  if (user.primaryEmailAddress?.emailAddress) {
    emails.push(user.primaryEmailAddress.emailAddress.toLowerCase());
  }
  if (Array.isArray(user.emailAddresses)) {
    for (const e of user.emailAddresses) {
      if (e?.emailAddress) emails.push(e.emailAddress.toLowerCase());
    }
  }
  return emails;
}

export function isUserAdmin(user: ClerkUserLike, extraAllowedEmails?: string | null): boolean {
  if (!user) return false;
  if (user.publicMetadata?.role === "admin") return true;
  const emails = getUserEmails(user);
  if (emails.some((e) => ENV_ADMIN_EMAILS.includes(e))) return true;
  if (extraAllowedEmails) {
    const extra = extraAllowedEmails.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (emails.some((e) => extra.includes(e))) return true;
  }
  return false;
}
