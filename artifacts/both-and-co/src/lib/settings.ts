import { useGetSiteSettings, getGetSiteSettingsQueryKey, SiteSettings } from "@workspace/api-client-react";

export const SETTINGS_DEFAULTS: SiteSettings = {
  bankName: "First Bank Nigeria",
  accountName: "BOTH & CO. LIMITED",
  accountNumber: "3012345678",
  whatsappNumber: "2348001234567",
  heroTitle: "Elevated. Sensual. Unapologetic.",
  heroSubtitle: "Luxury Nigerian womenswear accessories crafted for the stylish, confident woman.",
  heroImageUrl: null,
  adminEmails: "",
};

export function useSiteSettings(): SiteSettings {
  const { data } = useGetSiteSettings({ query: { queryKey: getGetSiteSettingsQueryKey(), staleTime: 60_000 } });
  return data ?? SETTINGS_DEFAULTS;
}
