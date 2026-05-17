import { useEffect } from "react";
import {
  useGetSiteSettings,
  getGetSiteSettingsQueryKey,
  SiteSettings,
  HeroBanner,
  SectionsConfig,
} from "@workspace/api-client-react";

export type { HeroBanner, SectionsConfig };

export const DEFAULT_SECTIONS: Required<SectionsConfig> = {
  featuredProducts: true,
  categoriesShowcase: true,
  brandStory: true,
  whatsappWidget: true,
};

export const SETTINGS_DEFAULTS: SiteSettings = {
  bankName: "First Bank Nigeria",
  accountName: "BOTH & CO. LIMITED",
  accountNumber: "3012345678",
  whatsappNumber: "2348001234567",
  heroTitle: "Elevated. Sensual. Unapologetic.",
  heroSubtitle: "Luxury Nigerian womenswear accessories crafted for the stylish, confident woman.",
  heroImageUrl: null,
  heroBanners: [],
  sectionsConfig: DEFAULT_SECTIONS,
  featuredProductIds: [],
  primaryColor: "#c45580",
  backgroundColor: "#110e0e",
  cardColor: "#1a1716",
  foregroundColor: "#f5ece4",
  accentColor: "#d490a9",
  mutedColor: "#2a2422",
  borderColor: "#4a2a3a",
  serifFont: "Playfair Display",
  sansFont: "Inter",
  buttonRadius: "0",
  buttonStyle: "solid",
  adminEmails: "",
  smtpEnabled: false,
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpFrom: "",
};

export function useSiteSettings(): SiteSettings {
  const { data } = useGetSiteSettings({ query: { queryKey: getGetSiteSettingsQueryKey(), staleTime: 60_000 } });
  return data ?? SETTINGS_DEFAULTS;
}

export function getSectionsConfig(settings: SiteSettings): Required<SectionsConfig> {
  return { ...DEFAULT_SECTIONS, ...(settings.sectionsConfig ?? {}) };
}

export function getHeroBanners(settings: SiteSettings): HeroBanner[] {
  const banners = settings.heroBanners ?? [];
  if (banners.length > 0) return banners;
  // Fall back to legacy single hero
  return [
    {
      title: settings.heroTitle,
      subtitle: settings.heroSubtitle,
      imageUrl: settings.heroImageUrl || "",
      ctaText: "Explore Collection",
      ctaLink: "/shop",
    },
  ];
}

// Convert #RRGGBB hex to "H S% L%" string for use in hsl(var(--x))
export function hexToHslString(hex: string): string {
  const m = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i.exec(hex.trim());
  if (!m) return "0 0% 50%";
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hh = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hh = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: hh = ((b - r) / d + 2); break;
      case b: hh = ((r - g) / d + 4); break;
    }
    hh *= 60;
  }
  return `${Math.round(hh)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ensureGoogleFontLink(family: string, weights: string) {
  if (!family) return;
  const id = `google-font-${family.replace(/\s+/g, "-").toLowerCase()}`;
  const existing = document.getElementById(id) as HTMLLinkElement | null;
  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:${weights}&display=swap`;
  if (existing && existing.href === href) return;
  if (existing) existing.remove();
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Apply theme settings to :root. Idempotent — safe to call on every render.
 */
export function useThemeApplier() {
  const settings = useSiteSettings();
  useEffect(() => {
    const root = document.documentElement;
    const pairs: Array<[string, string]> = [
      ["--primary", hexToHslString(settings.primaryColor)],
      ["--ring", hexToHslString(settings.primaryColor)],
      ["--background", hexToHslString(settings.backgroundColor)],
      ["--foreground", hexToHslString(settings.foregroundColor)],
      ["--card", hexToHslString(settings.cardColor)],
      ["--card-foreground", hexToHslString(settings.foregroundColor)],
      ["--popover", hexToHslString(settings.cardColor)],
      ["--popover-foreground", hexToHslString(settings.foregroundColor)],
      ["--accent", hexToHslString(settings.accentColor)],
      ["--muted", hexToHslString(settings.mutedColor)],
      ["--border", hexToHslString(settings.borderColor)],
      ["--input", hexToHslString(settings.borderColor)],
      ["--card-border", hexToHslString(settings.borderColor)],
      ["--popover-border", hexToHslString(settings.borderColor)],
    ];
    for (const [k, v] of pairs) root.style.setProperty(k, v);

    // Radius — accept e.g. "0", "6", "999" (px). Pill stays nice for buttons.
    const r = Number(settings.buttonRadius);
    const radius = isFinite(r) ? `${Math.max(0, Math.min(999, r))}px` : "0px";
    root.style.setProperty("--radius", radius);

    // Fonts
    root.style.setProperty("--app-font-sans", `'${settings.sansFont}', system-ui, sans-serif`);
    root.style.setProperty("--app-font-serif", `'${settings.serifFont}', Georgia, serif`);
    ensureGoogleFontLink(settings.sansFont, "wght@300;400;500;600;700");
    ensureGoogleFontLink(settings.serifFont, "ital,wght@0,400;0,500;0,600;0,700;1,400");

    // Button style: applied via body class so global CSS can react
    document.body.classList.toggle("btn-outline-mode", settings.buttonStyle === "outline");
  }, [settings]);
}
