import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { SiteSettings } from "@workspace/db";

export interface NotificationContext {
  name: string;
  orderNumber: string;
  total: string;
  items: string;
  address: string;
  status: string;
}

// ─── HTML builder ────────────────────────────────────────────────────────────

function buildHtml(body: string, headerExtra?: string): string {
  const lines = body
    .split("\n")
    .map((line) =>
      `<p style="margin:0 0 10px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;">${line || "&nbsp;"}</p>`
    )
    .join("");
  return `<!DOCTYPE html>
<html>
<body style="background:#f4f4f4;margin:0;padding:32px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #ddd;">
    <div style="background:#110e0e;padding:24px 32px;">
      <div style="font-family:Georgia,serif;font-size:24px;font-weight:bold;font-style:italic;letter-spacing:3px;color:#f5ece4;">BOTH &amp; CO.</div>
      ${headerExtra ? `<div style="font-family:sans-serif;font-size:11px;color:#d490a9;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">${headerExtra}</div>` : ""}
    </div>
    <div style="padding:32px;">${lines}</div>
    <div style="padding:16px 32px;border-top:1px solid #eee;background:#fafafa;">
      <p style="margin:0;font-family:sans-serif;font-size:11px;color:#999;">BOTH &amp; CO. — Luxury Nigerian Womenswear Accessories</p>
    </div>
  </div>
</body>
</html>`;
}

function applyPlaceholders(template: string, ctx: NotificationContext): string {
  return template
    .replace(/\{\{name\}\}/g, ctx.name)
    .replace(/\{\{order_number\}\}/g, ctx.orderNumber)
    .replace(/\{\{total\}\}/g, ctx.total)
    .replace(/\{\{items\}\}/g, ctx.items)
    .replace(/\{\{address\}\}/g, ctx.address)
    .replace(/\{\{status\}\}/g, ctx.status);
}

// ─── Email dispatcher (Resend first, SMTP fallback) ───────────────────────────

async function sendEmail(opts: {
  settings: SiteSettings;
  to: string;
  subject: string;
  text: string;
  html: string;
  headerExtra?: string;
}): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    // Resend path — simple API key, no SMTP setup needed
    const resend = new Resend(resendKey);
    // Use configured from address, or Resend's allowed sandbox sender
    // (sandbox allows sending to the verified address only — fine for owner alerts)
    const from = opts.settings.smtpFrom || "BOTH & CO. <onboarding@resend.dev>";
    // Note: in sandbox mode Resend ignores the from and uses onboarding@resend.dev anyway
    await resend.emails.send({
      from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return;
  }

  // SMTP fallback
  if (!opts.settings.smtpEnabled || !opts.settings.smtpHost || !opts.settings.smtpUser) return;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpPass) return;

  const transporter = nodemailer.createTransport({
    host: opts.settings.smtpHost,
    port: parseInt(opts.settings.smtpPort || "587", 10),
    secure: parseInt(opts.settings.smtpPort || "587", 10) === 465,
    auth: { user: opts.settings.smtpUser, pass: smtpPass },
  });
  await transporter.sendMail({
    from: opts.settings.smtpFrom || `BOTH & CO. <${opts.settings.smtpUser}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

function isEmailEnabled(settings: SiteSettings): boolean {
  // Resend: always enabled if API key is set
  if (process.env.RESEND_API_KEY) return true;
  // SMTP: needs the toggle + host + user
  return !!(settings.smtpEnabled && settings.smtpHost && settings.smtpUser && process.env.SMTP_PASS);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Send a templated notification email to a customer. */
export async function sendOrderNotification(
  settings: SiteSettings,
  toEmail: string,
  subject: string,
  body: string,
  ctx: NotificationContext
): Promise<void> {
  if (!isEmailEnabled(settings)) return;
  const resolvedSubject = applyPlaceholders(subject, ctx);
  const resolvedBody = applyPlaceholders(body, ctx);
  await sendEmail({
    settings,
    to: toEmail,
    subject: resolvedSubject,
    text: resolvedBody,
    html: buildHtml(resolvedBody),
  });
}

/** Send a plain alert to the shop owner when a new order is placed. */
export async function sendAdminOrderAlert(
  settings: SiteSettings,
  ctx: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: string;
    items: string;
    address: string;
    phone: string;
  }
): Promise<void> {
  if (!isEmailEnabled(settings)) return;

  // On Resend sandbox, can only send to the account owner's email.
  // Use notificationEmail if set, else smtpUser, else the Resend account email.
  const resendKey = process.env.RESEND_API_KEY;
  const dest = settings.notificationEmail || settings.smtpUser || (resendKey ? "bothandco01@gmail.com" : "");
  if (!dest) return;

  const subject = `New Order — ${ctx.orderNumber} (${ctx.total})`;
  const body = `New order received on BOTH & CO.

Order: ${ctx.orderNumber}
Total: ${ctx.total}
Customer: ${ctx.customerName} (${ctx.customerEmail})
Phone: ${ctx.phone}
Delivery Address: ${ctx.address}

Items:
${ctx.items}

Log in to your admin panel to confirm payment and update the order status.`;

  await sendEmail({
    settings,
    to: dest,
    subject,
    text: body,
    html: buildHtml(body, "New Sale Alert"),
  });
}
