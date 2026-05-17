import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSiteSettings,
  getGetSiteSettingsQueryKey,
  useUpdateSiteSettings,
  useListAdminProducts,
  getListAdminProductsQueryKey,
  SiteSettings,
  HeroBanner,
  Product,
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
import { DEFAULT_SECTIONS, SETTINGS_DEFAULTS } from "@/lib/settings";
import {
  Save, Banknote, MessageCircle, Image as ImageIcon, ShieldCheck,
  Palette, Type, MousePointerClick, Layout as LayoutIcon, Star,
  Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Upload, Mail,
} from "lucide-react";

const COLOR_PRESETS = [
  { name: "Rose Noir", primary: "#c45580", background: "#110e0e", card: "#1a1716", foreground: "#f5ece4", accent: "#d490a9", muted: "#2a2422", border: "#4a2a3a" },
  { name: "Champagne", primary: "#b8965a", background: "#0e0d0a", card: "#181612", foreground: "#f3eada", accent: "#d4b577", muted: "#2a261e", border: "#3d3322" },
  { name: "Emerald", primary: "#4a9d7a", background: "#0c1410", card: "#141d18", foreground: "#e8f0e8", accent: "#7dc3a3", muted: "#1e2922", border: "#2a3d33" },
  { name: "Royal", primary: "#7d5cb0", background: "#0e0d14", card: "#161420", foreground: "#ece8f5", accent: "#a888d4", muted: "#221f30", border: "#352d4a" },
  { name: "Coral Cream", primary: "#e07856", background: "#fdf8f3", card: "#ffffff", foreground: "#2a1f1a", accent: "#f4a07a", muted: "#f0e6dc", border: "#e0d2c2" },
  { name: "Slate Mint", primary: "#5fa8a3", background: "#f5f8f8", card: "#ffffff", foreground: "#1a2424", accent: "#84cac5", muted: "#e5edec", border: "#d0dcdb" },
];

const FONT_SUGGESTIONS = ["Playfair Display", "Cormorant Garamond", "Lora", "Cardo", "DM Serif Display", "Inter", "Poppins", "Montserrat", "Work Sans", "Manrope", "Open Sans", "Roboto"];

type Tab = "branding" | "homepage" | "featured" | "buttons" | "bank" | "contact" | "access" | "email";

const TABS: { id: Tab; label: string; icon: typeof Banknote }[] = [
  { id: "branding", label: "Brand", icon: Palette },
  { id: "homepage", label: "Homepage", icon: LayoutIcon },
  { id: "featured", label: "Featured", icon: Star },
  { id: "buttons", label: "Buttons", icon: MousePointerClick },
  { id: "bank", label: "Bank", icon: Banknote },
  { id: "contact", label: "Contact", icon: MessageCircle },
  { id: "access", label: "Access", icon: ShieldCheck },
  { id: "email", label: "Email", icon: Mail },
];

export default function AdminSettings() {
  const { user, isLoaded } = useUser();
  const isAdmin = isUserAdmin(user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useGetSiteSettings({
    query: { queryKey: getGetSiteSettingsQueryKey(), enabled: isAdmin },
  });

  const [values, setValues] = useState<SiteSettings>(SETTINGS_DEFAULTS);
  const [activeTab, setActiveTab] = useState<Tab>("branding");
  const [dirty, setDirty] = useState(false);

  useEffect(() => { if (data) { setValues(data); setDirty(false); } }, [data]);

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

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  const handleSave = () => {
    const payload: any = { ...values };
    if (payload.heroImageUrl === null) payload.heroImageUrl = undefined;
    updateSettings.mutate(
      { data: payload },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSiteSettingsQueryKey() });
          setDirty(false);
          toast({ title: "Settings saved", description: "Your changes are live now." });
        },
        onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
      }
    );
  };

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-2">Admin</p>
          <h1 className="font-serif italic text-3xl md:text-5xl">Site Customization</h1>
          <div className="h-px w-16 bg-primary mt-3" />
          <p className="text-muted-foreground text-sm mt-4 max-w-2xl">
            Change colors, fonts, banners, featured products and more — without touching code. Pick a tab below and your edits go live the moment you save.
          </p>
        </div>

        {/* Tabs (horizontally scrollable on mobile) */}
        <div className="border-b border-border mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-1 overflow-x-auto pb-px scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs tracking-widest uppercase border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                data-testid={`tab-${t.id}`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : (
          <div className="pb-32">
            {activeTab === "branding" && <BrandingTab values={values} set={set} />}
            {activeTab === "homepage" && <HomepageTab values={values} set={set} />}
            {activeTab === "featured" && <FeaturedTab values={values} set={set} />}
            {activeTab === "buttons" && <ButtonsTab values={values} set={set} />}
            {activeTab === "bank" && <BankTab values={values} set={set} />}
            {activeTab === "contact" && <ContactTab values={values} set={set} />}
            {activeTab === "access" && <AccessTab values={values} set={set} />}
            {activeTab === "email" && <EmailTab values={values} set={set} />}
          </div>
        )}

        {/* Sticky save bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border py-3 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {dirty ? "You have unsaved changes." : "All changes saved."}
            </p>
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending || !dirty}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 md:px-10 py-5 tracking-widest uppercase text-xs"
              data-testid="button-save-settings"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateSettings.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

/* -------- Reusable bits -------- */

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-5 md:p-8 mb-6">
      <div className="mb-5">
        <h3 className="font-serif text-xl md:text-2xl">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 border border-border bg-background cursor-pointer p-1"
          data-testid={`color-${label.toLowerCase().replace(/ /g, "-")}`}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-none border-border bg-background font-mono text-sm uppercase flex-1"
          placeholder="#000000"
        />
      </div>
    </Field>
  );
}

/* -------- Tab: Branding (colors + fonts) -------- */

function BrandingTab({ values, set }: { values: SiteSettings; set: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  const applyPreset = (p: typeof COLOR_PRESETS[number]) => {
    set("primaryColor", p.primary);
    set("backgroundColor", p.background);
    set("cardColor", p.card);
    set("foregroundColor", p.foreground);
    set("accentColor", p.accent);
    set("mutedColor", p.muted);
    set("borderColor", p.border);
  };

  return (
    <>
      <Section title="Color Palette" description="Pick a starting palette or fine-tune each color. Changes preview instantly across your site.">
        <Field label="Quick Palettes" hint="Tap one to apply, then adjust below.">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex items-center gap-2 border border-border hover:border-primary p-2 transition-colors"
                data-testid={`preset-${p.name.toLowerCase().replace(/ /g, "-")}`}
              >
                <div className="flex gap-1 flex-shrink-0">
                  <div className="w-4 h-8" style={{ background: p.background }} />
                  <div className="w-4 h-8" style={{ background: p.primary }} />
                  <div className="w-4 h-8" style={{ background: p.accent }} />
                </div>
                <span className="text-xs text-left flex-1 truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mt-4 pt-4 border-t border-border">
          <ColorField label="Primary (Buttons, Accents)" value={values.primaryColor} onChange={(v) => set("primaryColor", v)} />
          <ColorField label="Background" value={values.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
          <ColorField label="Card / Surface" value={values.cardColor} onChange={(v) => set("cardColor", v)} />
          <ColorField label="Text (Foreground)" value={values.foregroundColor} onChange={(v) => set("foregroundColor", v)} />
          <ColorField label="Accent" value={values.accentColor} onChange={(v) => set("accentColor", v)} />
          <ColorField label="Muted Background" value={values.mutedColor} onChange={(v) => set("mutedColor", v)} />
          <ColorField label="Borders / Dividers" value={values.borderColor} onChange={(v) => set("borderColor", v)} />
        </div>
      </Section>

      <Section title="Fonts" description="Use any Google Font. Type the exact family name — autocomplete shows popular options.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <Field label="Heading Font (Serif)" hint="Used for titles. e.g. Playfair Display">
            <FontPicker value={values.serifFont} onChange={(v) => set("serifFont", v)} placeholder="Playfair Display" />
            <div className="mt-3 px-4 py-3 bg-background border border-border">
              <span className="text-2xl" style={{ fontFamily: `'${values.serifFont}', serif`, fontStyle: "italic" }}>
                Elegant Heading
              </span>
            </div>
          </Field>
          <Field label="Body Font (Sans)" hint="Used for paragraphs and labels. e.g. Inter">
            <FontPicker value={values.sansFont} onChange={(v) => set("sansFont", v)} placeholder="Inter" />
            <div className="mt-3 px-4 py-3 bg-background border border-border">
              <span className="text-sm" style={{ fontFamily: `'${values.sansFont}', sans-serif` }}>
                The quick brown fox jumps over the lazy dog.
              </span>
            </div>
          </Field>
        </div>
      </Section>
    </>
  );
}

function FontPicker({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(() => {
    const q = value.toLowerCase();
    return FONT_SUGGESTIONS.filter((f) => f.toLowerCase().includes(q)).slice(0, 8);
  }, [value]);
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="rounded-none border-border bg-background"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 bg-card border border-border max-h-60 overflow-y-auto shadow-lg">
          {filtered.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { onChange(f); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              style={{ fontFamily: `'${f}', sans-serif` }}
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------- Tab: Homepage (banners + section toggles) -------- */

function HomepageTab({ values, set }: { values: SiteSettings; set: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  const banners = values.heroBanners ?? [];

  const updateBanner = (i: number, patch: Partial<HeroBanner>) => {
    const next = banners.map((b, idx) => idx === i ? { ...b, ...patch } : b);
    set("heroBanners", next);
  };
  const addBanner = () => {
    set("heroBanners", [...banners, { title: "New Banner", subtitle: "Tell your customers something compelling.", imageUrl: "", ctaText: "Shop Now", ctaLink: "/shop" }]);
  };
  const removeBanner = (i: number) => set("heroBanners", banners.filter((_, idx) => idx !== i));
  const moveBanner = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= banners.length) return;
    const next = [...banners];
    [next[i], next[j]] = [next[j], next[i]];
    set("heroBanners", next);
  };

  const sections = { ...DEFAULT_SECTIONS, ...(values.sectionsConfig ?? {}) };
  const toggleSection = (key: keyof typeof DEFAULT_SECTIONS, on: boolean) => {
    set("sectionsConfig", { ...sections, [key]: on });
  };

  return (
    <>
      <Section title="Hero Banners (Carousel)" description="The big rotating banners at the top of your homepage. Add as many as you like — they auto-rotate every 6 seconds.">
        {banners.length === 0 && (
          <div className="text-center py-8 border border-dashed border-border mb-4">
            <p className="text-sm text-muted-foreground mb-3">No banners yet. Add your first one.</p>
          </div>
        )}

        <div className="space-y-4">
          {banners.map((b, i) => (
            <div key={i} className="border border-border bg-background p-4" data-testid={`banner-${i}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs tracking-widest uppercase text-muted-foreground">Banner {i + 1}</span>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveBanner(i, -1)} disabled={i === 0} className="p-1.5 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveBanner(i, 1)} disabled={i === banners.length - 1} className="p-1.5 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeBanner(i)} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Title">
                  <Input value={b.title} onChange={(e) => updateBanner(i, { title: e.target.value })} className="rounded-none border-border bg-card" />
                </Field>
                <Field label="Button Text">
                  <Input value={b.ctaText} onChange={(e) => updateBanner(i, { ctaText: e.target.value })} className="rounded-none border-border bg-card" placeholder="Shop Now" />
                </Field>
                <Field label="Subtitle">
                  <Textarea value={b.subtitle} onChange={(e) => updateBanner(i, { subtitle: e.target.value })} rows={2} className="rounded-none border-border bg-card resize-none" />
                </Field>
                <Field label="Button Link" hint="Where the button goes. e.g. /shop or /shop?category=heels">
                  <Input value={b.ctaLink} onChange={(e) => updateBanner(i, { ctaLink: e.target.value })} className="rounded-none border-border bg-card" placeholder="/shop" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Background Image" hint="Upload an image or paste a full URL.">
                    <ImageInput value={b.imageUrl} onChange={(v) => updateBanner(i, { imageUrl: v })} />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" onClick={addBanner} variant="outline" className="rounded-none border-border w-full mt-4" data-testid="button-add-banner">
          <Plus className="h-4 w-4 mr-2" /> Add Banner
        </Button>

        {banners.length === 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            Tip: if you leave this empty, your homepage uses the single hero below.
          </p>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="text-sm tracking-widest uppercase text-muted-foreground mb-4">Fallback Hero (used when no banners above)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title"><Input value={values.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} className="rounded-none border-border bg-background" /></Field>
            <Field label="Hero Image URL"><Input value={values.heroImageUrl ?? ""} onChange={(e) => set("heroImageUrl", e.target.value || (null as any))} className="rounded-none border-border bg-background" /></Field>
            <div className="md:col-span-2">
              <Field label="Subtitle"><Textarea value={values.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} rows={2} className="rounded-none border-border bg-background resize-none" /></Field>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Homepage Sections" description="Turn sections on or off without touching code.">
        <div className="space-y-3">
          <ToggleRow label="Featured Products" description="The 4-up product grid below the hero." on={sections.featuredProducts} onChange={(v) => toggleSection("featuredProducts", v)} />
          <ToggleRow label="Categories Showcase" description="Big Heels and Glasses tiles." on={sections.categoriesShowcase} onChange={(v) => toggleSection("categoriesShowcase", v)} />
          <ToggleRow label="Brand Story" description="'The Philosophy' section near the bottom." on={sections.brandStory} onChange={(v) => toggleSection("brandStory", v)} />
          <ToggleRow label="WhatsApp Chat Widget" description="The floating green button across the site." on={sections.whatsappWidget} onChange={(v) => toggleSection("whatsappWidget", v)} />
        </div>
      </Section>
    </>
  );
}

function ToggleRow({ label, description, on, onChange }: { label: string; description?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="w-full flex items-center justify-between p-4 border border-border bg-background hover:border-primary/50 transition-colors text-left"
      data-testid={`toggle-${label.toLowerCase().replace(/ /g, "-")}`}
    >
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className={`relative w-11 h-6 flex-shrink-0 transition-colors ${on ? "bg-primary" : "bg-muted"}`}>
        <div className={`absolute top-0.5 ${on ? "left-[22px]" : "left-0.5"} w-5 h-5 bg-white transition-all`} />
      </div>
    </button>
  );
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-2">
      {value && (
        <div className="relative aspect-[3/1] bg-background border border-border overflow-hidden">
          <img src={value} alt="Banner" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white flex items-center justify-center hover:bg-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 border border-dashed border-border bg-background hover:border-primary py-3 text-xs tracking-widest uppercase transition-colors">
          <Upload className="h-4 w-4" /> Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste image URL" className="rounded-none border-border bg-background text-sm" />
    </div>
  );
}

/* -------- Tab: Featured products ordering -------- */

function FeaturedTab({ values, set }: { values: SiteSettings; set: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  const { data: allProducts } = useListAdminProducts({ query: { queryKey: getListAdminProductsQueryKey() } });
  const featuredOnly = useMemo(() => (allProducts || []).filter((p) => p.featured), [allProducts]);
  const order = values.featuredProductIds ?? [];

  const ordered = useMemo(() => {
    const byId = new Map(featuredOnly.map((p) => [p.id, p]));
    const result: Product[] = [];
    for (const id of order) { const p = byId.get(id); if (p) { result.push(p); byId.delete(id); } }
    for (const p of byId.values()) result.push(p);
    return result;
  }, [featuredOnly, order]);

  const setOrder = (ids: number[]) => set("featuredProductIds", ids);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= ordered.length) return;
    const ids = ordered.map((p) => p.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setOrder(ids);
  };
  const remove = (id: number) => setOrder(ordered.filter((p) => p.id !== id).map((p) => p.id));

  const nonFeatured = useMemo(() => (allProducts || []).filter((p) => !p.featured), [allProducts]);

  return (
    <>
      <Section title="Featured on Homepage" description="The first 4 products here show in the 'Featured Pieces' grid, in this order. Toggle the star on a product to add or remove it.">
        {ordered.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border">
            <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No featured products yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Mark a product as 'Featured' in the Products tab.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ordered.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 p-3 border border-border bg-background ${i < 4 ? "" : "opacity-50"}`} data-testid={`featured-row-${p.id}`}>
                <div className={`flex-shrink-0 w-7 h-7 flex items-center justify-center text-xs ${i < 4 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {i + 1}
                </div>
                <div className="w-12 h-16 bg-muted flex-shrink-0 overflow-hidden">
                  <img src={p.imageUrl || (p.category === "heels" ? "/placeholder-heels.png" : "/placeholder-glasses.png")} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">₦{p.price.toLocaleString()} · {p.category}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 hover:bg-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === ordered.length - 1} className="p-1.5 hover:bg-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(p.id)} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground" title="Remove from order (still featured)"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            {ordered.length > 4 && (
              <p className="text-xs text-muted-foreground italic px-1">Items 5+ are featured but won't appear on the homepage grid.</p>
            )}
          </div>
        )}

        {nonFeatured.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">Add Featured Products</p>
            <div className="flex flex-wrap gap-2">
              {nonFeatured.slice(0, 12).map((p) => (
                <span key={p.id} className="text-xs px-2 py-1 bg-muted text-muted-foreground border border-border">
                  {p.name}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              To add a product here, open it in the <strong>Products</strong> tab and tick the 'Featured' checkbox.
            </p>
          </div>
        )}
      </Section>
    </>
  );
}

/* -------- Tab: Buttons -------- */

function ButtonsTab({ values, set }: { values: SiteSettings; set: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  const radiusPresets = [
    { label: "Sharp", value: "0", description: "Crisp 90° corners" },
    { label: "Soft", value: "4", description: "Slightly rounded" },
    { label: "Rounded", value: "8", description: "Friendly rounded" },
    { label: "Pill", value: "999", description: "Fully rounded" },
  ];

  return (
    <Section title="Button & Input Style" description="Controls roundness and fill of buttons (and form inputs) across the whole site.">
      <Field label="Corner Roundness">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {radiusPresets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => set("buttonRadius", p.value)}
              className={`p-4 border bg-background transition-colors ${values.buttonRadius === p.value ? "border-primary" : "border-border hover:border-primary/50"}`}
              data-testid={`radius-${p.label.toLowerCase()}`}
            >
              <div className="bg-primary text-primary-foreground py-2 px-3 text-xs tracking-widest uppercase mb-2" style={{ borderRadius: `${p.value}px` }}>
                {p.label}
              </div>
              <p className="text-[10px] text-muted-foreground">{p.description}</p>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Custom Roundness (pixels)" hint="0 = sharp, 999 = pill. Used if you want something between the presets.">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={50}
            value={Math.min(50, Number(values.buttonRadius) || 0)}
            onChange={(e) => set("buttonRadius", String(e.target.value))}
            className="flex-1 accent-primary"
          />
          <Input
            value={values.buttonRadius}
            onChange={(e) => set("buttonRadius", e.target.value.replace(/[^\d]/g, ""))}
            className="rounded-none border-border bg-background w-20 text-center"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>
      </Field>

      <Field label="Button Fill Style">
        <div className="grid grid-cols-2 gap-2">
          {(["solid", "outline"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set("buttonStyle", s)}
              className={`p-5 border bg-background transition-colors text-center ${values.buttonStyle === s ? "border-primary" : "border-border hover:border-primary/50"}`}
              data-testid={`btnstyle-${s}`}
            >
              <span
                className={`inline-block py-2 px-4 text-xs tracking-widest uppercase ${s === "solid" ? "bg-primary text-primary-foreground" : "border border-primary text-primary"}`}
                style={{ borderRadius: `${values.buttonRadius || 0}px` }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              <p className="text-[10px] text-muted-foreground mt-2">{s === "solid" ? "Filled buttons" : "Transparent with border"}</p>
            </button>
          ))}
        </div>
      </Field>
    </Section>
  );
}

/* -------- Other tabs -------- */

function BankTab({ values, set }: { values: SiteSettings; set: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  return (
    <Section title="Bank Transfer" description="Shown to customers at checkout. Update if your bank details change.">
      <Field label="Bank Name"><Input value={values.bankName} onChange={(e) => set("bankName", e.target.value)} className="rounded-none border-border bg-background" /></Field>
      <Field label="Account Name"><Input value={values.accountName} onChange={(e) => set("accountName", e.target.value)} className="rounded-none border-border bg-background" /></Field>
      <Field label="Account Number"><Input value={values.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} className="rounded-none border-border bg-background" /></Field>
    </Section>
  );
}

function ContactTab({ values, set }: { values: SiteSettings; set: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  return (
    <Section title="WhatsApp" description="The floating green button on every page links to this number.">
      <Field label="WhatsApp Number" hint="Include country code, no + or spaces. Example: 2348001234567">
        <Input value={values.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} className="rounded-none border-border bg-background" />
      </Field>
    </Section>
  );
}

function AccessTab({ values, set }: { values: SiteSettings; set: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  return (
    <Section title="Admin Access" description="People who can access the admin dashboard. Anyone with these emails will have admin powers once they sign in.">
      <Field label="Admin Emails" hint="Comma-separated. e.g. owner@brand.com, manager@brand.com">
        <Textarea value={values.adminEmails} onChange={(e) => set("adminEmails", e.target.value)} rows={3} className="rounded-none border-border bg-background resize-none" />
      </Field>
    </Section>
  );
}

function EmailTab({ values, set }: { values: SiteSettings; set: <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => void }) {
  return (
    <div className="space-y-8">
      <Section title="Email Notifications" description="Configure SMTP credentials so BOTH & CO. can automatically send order status emails to customers. Edit the email templates themselves under Admin → Templates → Notifications.">
        <Field label="Enable Email Sending">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              role="checkbox"
              aria-checked={!!values.smtpEnabled}
              onClick={() => set("smtpEnabled", !values.smtpEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${values.smtpEnabled ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${values.smtpEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </div>
            <span className="text-sm text-foreground">{values.smtpEnabled ? "Enabled — emails will be sent on order status changes" : "Disabled — no emails will be sent"}</span>
          </label>
        </Field>

        <Field label="SMTP Host" hint="Your email provider's outgoing mail server. e.g. smtp.gmail.com or mail.yourdomain.com">
          <Input value={values.smtpHost ?? ""} onChange={(e) => set("smtpHost", e.target.value)} className="rounded-none border-border bg-background font-mono" placeholder="smtp.gmail.com" />
        </Field>

        <Field label="SMTP Port" hint="Usually 587 (TLS/STARTTLS) or 465 (SSL). Use 587 if unsure.">
          <Input value={values.smtpPort ?? "587"} onChange={(e) => set("smtpPort", e.target.value)} className="rounded-none border-border bg-background font-mono w-40" placeholder="587" />
        </Field>

        <Field label="SMTP Username" hint="Usually your full email address.">
          <Input value={values.smtpUser ?? ""} onChange={(e) => set("smtpUser", e.target.value)} className="rounded-none border-border bg-background font-mono" placeholder="orders@yourdomain.com" />
        </Field>

        <Field label="From Address" hint="The name and address customers see as the sender. e.g. BOTH &amp; CO. &lt;orders@yourdomain.com&gt;">
          <Input value={values.smtpFrom ?? ""} onChange={(e) => set("smtpFrom", e.target.value)} className="rounded-none border-border bg-background font-mono" placeholder="BOTH & CO. <orders@yourdomain.com>" />
        </Field>

        <div className="bg-muted/30 border border-border p-4 rounded-none text-sm text-muted-foreground">
          <p className="font-semibold text-foreground text-xs uppercase tracking-widest mb-2">SMTP Password</p>
          <p>
            For security, the SMTP password is stored as a server environment secret named{" "}
            <code className="bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">SMTP_PASS</code>.
            Set it in your deployment environment secrets — it is never exposed through the admin panel.
          </p>
        </div>
      </Section>
    </div>
  );
}
