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

function applyPlaceholders(template: string, ctx: NotificationContext): string {
  return template
    .replace(/\{\{name\}\}/g, ctx.name)
    .replace(/\{\{order_number\}\}/g, ctx.orderNumber)
    .replace(/\{\{total\}\}/g, ctx.total)
    .replace(/\{\{items\}\}/g, ctx.items)
    .replace(/\{\{address\}\}/g, ctx.address)
    .replace(/\{\{status\}\}/g, ctx.status);
}

export async function sendOrderNotification(
  settings: SiteSettings,
  toEmail: string,
  subject: string,
  body: string,
  ctx: NotificationContext
): Promise<void> {
  if (!settings.smtpEnabled || !settings.smtpHost || !settings.smtpUser) {
    return;
  }

  const smtpPass = process.env.SMTP_PASS;
  if (!smtpPass) return;

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: parseInt(settings.smtpPort || "587", 10),
    secure: parseInt(settings.smtpPort || "587", 10) === 465,
    auth: { user: settings.smtpUser, pass: smtpPass },
  });

  const resolvedSubject = applyPlaceholders(subject, ctx);
  const resolvedBody = applyPlaceholders(body, ctx);

  const htmlBody = resolvedBody
    .split("\n")
    .map((line) => `<p style="margin:0 0 8px 0;font-family:sans-serif;font-size:14px;color:#333;">${line}</p>`)
    .join("");

  await transporter.sendMail({
    from: settings.smtpFrom || settings.smtpUser,
    to: toEmail,
    subject: resolvedSubject,
    text: resolvedBody,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="background:#f5f5f5;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;padding:32px;">
          <div style="font-family:serif;font-size:22px;font-weight:bold;letter-spacing:2px;margin-bottom:24px;color:#111;">
            BOTH &amp; CO.
          </div>
          ${htmlBody}
          <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-family:sans-serif;font-size:12px;color:#999;">
            BOTH &amp; CO. — Luxury Nigerian Womenswear Accessories
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
