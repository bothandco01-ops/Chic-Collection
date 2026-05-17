import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPageContent,
  getGetPageContentQueryKey,
  useUpsertPageContent,
} from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { AdminShell } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { isUserAdmin } from "@/lib/admin";
import { useToast } from "@/hooks/use-toast";
import { Save, FileText, Mail, Receipt, ChevronDown, ChevronRight } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReceiptTemplate {
  tagline: string;
  address: string;
  footerMessage: string;
  footerSubtext: string;
}

interface NotificationTemplate {
  subject: string;
  body: string;
}

const RECEIPT_DEFAULTS: ReceiptTemplate = {
  tagline: "Luxury Nigerian Womenswear Accessories",
  address: "Lagos, Nigeria",
  footerMessage: "Thank you for shopping with BOTH & CO.",
  footerSubtext: "For enquiries, please contact us via WhatsApp.",
};

const NOTIFICATION_DEFAULTS: Record<string, NotificationTemplate> = {
  "notification-order-placed": {
    subject: "Your BOTH & CO. order has been received — {{order_number}}",
    body: `Dear {{name}},

Thank you for your order! We have received your order {{order_number}} totalling {{total}}.

Items Ordered:
{{items}}

Delivery Address: {{address}}

Please transfer the total to our bank account and upload your payment proof from your order page. We will confirm your payment as soon as we receive it.

Warm regards,
BOTH & CO.`,
  },
  "notification-payment-confirmed": {
    subject: "Payment confirmed — Order {{order_number}}",
    body: `Dear {{name}},

Great news! Your payment for order {{order_number}} ({{total}}) has been confirmed.

We are now preparing your items and will notify you once your order ships.

Items:
{{items}}

Thank you for shopping with BOTH & CO.

Warm regards,
BOTH & CO.`,
  },
  "notification-order-shipped": {
    subject: "Your order is on its way — {{order_number}}",
    body: `Dear {{name}},

Your order {{order_number}} has been shipped and is on its way to you.

Delivery Address: {{address}}

Items:
{{items}}

Please allow 2–5 business days for delivery. Contact us via WhatsApp if you have any questions.

Warm regards,
BOTH & CO.`,
  },
  "notification-order-delivered": {
    subject: "Order delivered — {{order_number}}",
    body: `Dear {{name}},

Your order {{order_number}} has been marked as delivered. We hope you love your new pieces!

Items:
{{items}}

If you have any questions or concerns about your order, please contact us via WhatsApp.

Thank you for shopping with BOTH & CO.

Warm regards,
BOTH & CO.`,
  },
  "notification-order-cancelled": {
    subject: "Order cancelled — {{order_number}}",
    body: `Dear {{name}},

We are writing to confirm that your order {{order_number}} ({{total}}) has been cancelled.

If you believe this is an error, or if you have any questions, please contact us via WhatsApp immediately.

We hope to serve you again soon.

Warm regards,
BOTH & CO.`,
  },
};

const NOTIFICATION_LABELS: Record<string, string> = {
  "notification-order-placed": "Order Placed",
  "notification-payment-confirmed": "Payment Confirmed",
  "notification-order-shipped": "Order Shipped",
  "notification-order-delivered": "Order Delivered",
  "notification-order-cancelled": "Order Cancelled",
};

const NOTIFICATION_DESCRIPTIONS: Record<string, string> = {
  "notification-order-placed": "Sent to customer immediately after they place an order.",
  "notification-payment-confirmed": "Sent when admin marks payment as confirmed.",
  "notification-order-shipped": "Sent when admin marks order as shipped.",
  "notification-order-delivered": "Sent when admin marks order as delivered.",
  "notification-order-cancelled": "Sent when admin cancels an order.",
};

type MainTab = "receipt" | "notifications";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseReceiptTemplate(body: string | undefined): ReceiptTemplate {
  if (!body) return RECEIPT_DEFAULTS;
  try { return { ...RECEIPT_DEFAULTS, ...JSON.parse(body) }; } catch { return RECEIPT_DEFAULTS; }
}

function parseNotificationTemplate(body: string | undefined, slug: string): NotificationTemplate {
  const defaults = NOTIFICATION_DEFAULTS[slug] ?? { subject: "", body: "" };
  if (!body) return defaults;
  try { return { ...defaults, ...JSON.parse(body) }; } catch { return defaults; }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function PlaceholderBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-block bg-muted text-muted-foreground text-[11px] font-mono px-2 py-0.5 border border-border mr-1 mb-1">
      {`{{${tag}}}`}
    </span>
  );
}

// ─── Receipt Tab ─────────────────────────────────────────────────────────────

function ReceiptTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetPageContent("receipt-template", {
    query: { queryKey: getGetPageContentQueryKey("receipt-template"), retry: false },
  });
  const [values, setValues] = useState<ReceiptTemplate | null>(null);
  const upsert = useUpsertPageContent();

  const current = values ?? parseReceiptTemplate(data?.body);

  const set = (k: keyof ReceiptTemplate, v: string) => setValues({ ...current, [k]: v });

  const handleSave = () => {
    upsert.mutate(
      {
        slug: "receipt-template",
        data: { title: "Receipt Template", body: JSON.stringify(current) },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPageContentQueryKey("receipt-template") });
          setValues(null);
          toast({ title: "Receipt template saved" });
        },
        onError: () => toast({ title: "Failed to save receipt template", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif italic text-xl text-foreground mb-1">Receipt / Invoice Layout</h3>
        <p className="text-sm text-muted-foreground">
          These fields appear on the printed invoice customers receive with their order.
        </p>
      </div>

      <div className="grid gap-6">
        <Field label="Business Tagline" hint="Appears under the BOTH & CO. logo on the receipt header.">
          <Input
            value={current.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            className="rounded-none border-border bg-background"
            placeholder="Luxury Nigerian Womenswear Accessories"
          />
        </Field>

        <Field label="Business Address" hint="City, country or full address shown on the receipt header.">
          <Input
            value={current.address}
            onChange={(e) => set("address", e.target.value)}
            className="rounded-none border-border bg-background"
            placeholder="Lagos, Nigeria"
          />
        </Field>

        <Field label="Footer Message" hint="The main thank-you line at the bottom of the receipt.">
          <Input
            value={current.footerMessage}
            onChange={(e) => set("footerMessage", e.target.value)}
            className="rounded-none border-border bg-background"
            placeholder="Thank you for shopping with BOTH & CO."
          />
        </Field>

        <Field label="Footer Sub-text" hint="Secondary line below the footer message (e.g. contact or returns info).">
          <Input
            value={current.footerSubtext}
            onChange={(e) => set("footerSubtext", e.target.value)}
            className="rounded-none border-border bg-background"
            placeholder="For enquiries, please contact us via WhatsApp."
          />
        </Field>
      </div>

      <div className="bg-card border border-border p-5 rounded-none">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Preview (Header)</p>
        <div className="flex justify-between items-start border-b border-gray-200 pb-4">
          <div>
            <div className="font-serif italic font-bold text-lg text-foreground tracking-wider">BOTH &amp; CO.</div>
            <p className="text-muted-foreground text-xs">{current.tagline || "Luxury Nigerian Womenswear Accessories"}</p>
            <p className="text-muted-foreground text-xs">{current.address || "Lagos, Nigeria"}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">Invoice</div>
        </div>
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-gray-200 mt-4">
          <p className="font-serif italic text-sm text-foreground">{current.footerMessage || "Thank you for shopping with BOTH & CO."}</p>
          <p className="text-xs">{current.footerSubtext || "For enquiries, please contact us via WhatsApp."}</p>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={upsert.isPending}
        className="rounded-none gap-2 uppercase tracking-widest text-xs px-8"
      >
        <Save className="h-4 w-4" />
        {upsert.isPending ? "Saving..." : "Save Receipt Template"}
      </Button>
    </div>
  );
}

// ─── Single Notification Template Editor ─────────────────────────────────────

function NotificationEditor({ slug }: { slug: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useGetPageContent(slug, {
    query: { queryKey: getGetPageContentQueryKey(slug), retry: false },
  });
  const [values, setValues] = useState<NotificationTemplate | null>(null);
  const upsert = useUpsertPageContent();

  const current = values ?? parseNotificationTemplate(data?.body, slug);
  const set = (k: keyof NotificationTemplate, v: string) => setValues({ ...current, [k]: v });

  const handleSave = () => {
    upsert.mutate(
      {
        slug,
        data: { title: NOTIFICATION_LABELS[slug] ?? slug, body: JSON.stringify(current) },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPageContentQueryKey(slug) });
          setValues(null);
          toast({ title: `"${NOTIFICATION_LABELS[slug]}" template saved` });
        },
        onError: () => toast({ title: "Failed to save template", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="border border-border">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold tracking-wide uppercase text-foreground">{NOTIFICATION_LABELS[slug]}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{NOTIFICATION_DESCRIPTIONS[slug]}</p>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-6 border-t border-border space-y-5 pt-5">
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-9 w-full" /><Skeleton className="h-32 w-full" /></div>
          ) : (
            <>
              <Field label="Subject Line">
                <Input
                  value={current.subject}
                  onChange={(e) => set("subject", e.target.value)}
                  className="rounded-none border-border bg-background font-mono text-sm"
                />
              </Field>

              <Field label="Message Body">
                <Textarea
                  value={current.body}
                  onChange={(e) => set("body", e.target.value)}
                  rows={10}
                  className="rounded-none border-border bg-background resize-y font-mono text-sm"
                />
              </Field>

              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Available Placeholders</p>
                <div>
                  <PlaceholderBadge tag="name" />
                  <PlaceholderBadge tag="order_number" />
                  <PlaceholderBadge tag="total" />
                  <PlaceholderBadge tag="items" />
                  <PlaceholderBadge tag="address" />
                  <PlaceholderBadge tag="status" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Placeholders are automatically replaced with the customer's real order details when the email is sent.
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={upsert.isPending}
                size="sm"
                className="rounded-none gap-2 uppercase tracking-widest text-xs"
              >
                <Save className="h-3.5 w-3.5" />
                {upsert.isPending ? "Saving..." : "Save Template"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const SLUGS = [
    "notification-order-placed",
    "notification-payment-confirmed",
    "notification-order-shipped",
    "notification-order-delivered",
    "notification-order-cancelled",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif italic text-xl text-foreground mb-1">Email Notification Templates</h3>
        <p className="text-sm text-muted-foreground">
          Customise the emails sent to customers when their order status changes. Emails are sent automatically when SMTP is configured in Settings.
        </p>
      </div>

      <div className="bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground text-xs uppercase tracking-widest mb-1">Setup Required</p>
        To activate automatic email sending, configure your SMTP credentials under{" "}
        <strong className="text-foreground">Admin &rarr; Settings &rarr; Email</strong>.
        Templates are saved regardless and will be used as soon as SMTP is enabled.
      </div>

      <div className="space-y-2">
        {SLUGS.map((slug) => (
          <NotificationEditor key={slug} slug={slug} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminTemplates() {
  const { user, isLoaded } = useUser();
  const isAdmin = isUserAdmin(user);
  const [activeTab, setActiveTab] = useState<MainTab>("receipt");

  if (!isLoaded) {
    return (
      <AdminShell>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <Skeleton className="h-10 w-48 mb-10" />
        </div>
      </AdminShell>
    );
  }
  if (!user) return <Redirect to="/sign-in" />;
  if (!isAdmin) {
    return (
      <AdminShell>
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <h2 className="font-serif italic text-3xl mb-4">Admin Access Required</h2>
          <p className="text-muted-foreground">You do not have admin privileges.</p>
        </div>
      </AdminShell>
    );
  }

  const TABS: { id: MainTab; label: string; icon: typeof FileText; description: string }[] = [
    { id: "receipt", label: "Receipt", icon: Receipt, description: "Invoice / receipt text" },
    { id: "notifications", label: "Notifications", icon: Mail, description: "Customer email templates" },
  ];

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif italic text-3xl text-foreground mb-2">Templates</h1>
          <p className="text-muted-foreground text-sm">
            Edit the receipt layout and the emails automatically sent to customers at each stage of their order.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border mb-8">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-widest border-b-2 transition-colors -mb-px ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "receipt" && <ReceiptTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </AdminShell>
  );
}
