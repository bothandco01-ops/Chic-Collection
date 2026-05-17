import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSiteSettings,
  getGetSiteSettingsQueryKey,
  useUpdateSiteSettings,
  SiteSettings,
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
import { Save, Banknote, MessageCircle, Image as ImageIcon, ShieldCheck } from "lucide-react";

type Field = keyof SiteSettings;

const SECTIONS: { title: string; description: string; icon: typeof Banknote; fields: { name: Field; label: string; hint?: string; type?: "text" | "textarea" }[] }[] = [
  {
    title: "Bank Transfer",
    description: "Shown to customers at checkout.",
    icon: Banknote,
    fields: [
      { name: "bankName", label: "Bank Name" },
      { name: "accountName", label: "Account Name" },
      { name: "accountNumber", label: "Account Number" },
    ],
  },
  {
    title: "WhatsApp",
    description: "The floating chat button opens this number.",
    icon: MessageCircle,
    fields: [
      { name: "whatsappNumber", label: "WhatsApp Number", hint: "Include country code, no + or spaces. Example: 2348001234567" },
    ],
  },
  {
    title: "Homepage Hero",
    description: "Big banner that greets visitors on the homepage.",
    icon: ImageIcon,
    fields: [
      { name: "heroTitle", label: "Hero Title" },
      { name: "heroSubtitle", label: "Hero Subtitle", type: "textarea" },
      { name: "heroImageUrl", label: "Hero Background Image URL", hint: "Optional. Paste a full image URL — leave blank to keep the current visual." },
    ],
  },
  {
    title: "Admin Access",
    description: "Comma-separated emails granted admin access (in addition to env var).",
    icon: ShieldCheck,
    fields: [
      { name: "adminEmails", label: "Admin Emails", hint: "e.g. owner@brand.com, manager@brand.com" },
    ],
  },
];

export default function AdminSettings() {
  const { user, isLoaded } = useUser();
  const isAdmin = isUserAdmin(user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetSiteSettings({
    query: { queryKey: getGetSiteSettingsQueryKey(), enabled: isAdmin },
  });

  const [values, setValues] = useState<Partial<SiteSettings>>({});
  useEffect(() => { if (data) setValues(data); }, [data]);

  const updateSettings = useUpdateSiteSettings();

  if (!isLoaded) {
    return <AdminShell><div className="max-w-3xl mx-auto px-4 py-16"><Skeleton className="h-10 w-48 mb-10" /></div></AdminShell>;
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

  const handleSave = () => {
    updateSettings.mutate(
      { data: { ...values, heroImageUrl: values.heroImageUrl ?? undefined } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSiteSettingsQueryKey() });
          toast({ title: "Settings saved" });
        },
        onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
      }
    );
  };

  const set = (k: Field, v: string) => setValues((p) => ({ ...p, [k]: v }));

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <div className="mb-10">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-2">Admin</p>
          <h1 className="font-serif italic text-3xl md:text-5xl">Site Settings</h1>
          <div className="h-px w-16 bg-primary mt-3" />
          <p className="text-muted-foreground text-sm mt-4 max-w-xl">
            Edit your bank details, WhatsApp number, homepage banner and admin access. Changes apply to the live site immediately after saving.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : (
          <div className="space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.title} className="bg-card border border-border p-6 md:p-8" data-testid={`section-${section.title.toLowerCase().replace(/ /g, "-")}`}>
                <div className="flex items-start gap-3 mb-6">
                  <section.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-serif text-xl">{section.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {section.fields.map((f) => (
                    <div key={f.name}>
                      <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">{f.label}</label>
                      {f.type === "textarea" ? (
                        <Textarea
                          value={(values[f.name] as string) ?? ""}
                          onChange={(e) => set(f.name, e.target.value)}
                          rows={3}
                          className="rounded-none border-border bg-background resize-none"
                          data-testid={`input-${f.name}`}
                        />
                      ) : (
                        <Input
                          value={(values[f.name] as string) ?? ""}
                          onChange={(e) => set(f.name, e.target.value)}
                          className="rounded-none border-border bg-background"
                          data-testid={`input-${f.name}`}
                        />
                      )}
                      {f.hint && <p className="text-xs text-muted-foreground mt-1.5">{f.hint}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border py-4 -mx-4 px-4 md:mx-0 md:px-0 md:border-0 md:py-0 md:static">
              <Button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="w-full md:w-auto rounded-none px-10 py-5 tracking-widest uppercase text-xs"
                data-testid="button-save-settings"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateSettings.isPending ? "Saving..." : "Save All Changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
