import { connectDB } from "@/lib/mongodb";
import { SiteSettings, type ISiteSettings } from "@/models/SiteSettings";
import { BRAND, COLORS } from "@/lib/constants";
import type { SiteSettings as SiteSettingsType } from "@/lib/types";

export const DEFAULT_SITE_SETTINGS: SiteSettingsType = {
  brandName: BRAND.name,
  fullName: BRAND.fullName,
  tagline: BRAND.tagline,
  subTagline: BRAND.subTagline,
  logoTagline: BRAND.logoTagline,
  logoSubTagline: BRAND.logoSubTagline,
  logoUrl: "",
  heroTitle: "RIDE THE",
  heroHighlight: "FUTURE",
  heroSubtitle: `${BRAND.tagline} ${BRAND.subTagline}`,
  accentColor: COLORS.electricOrange,
  hiddenProductSlugs: [],
};

function mapSettings(doc: ISiteSettings): SiteSettingsType {
  return {
    brandName: doc.brandName,
    fullName: doc.fullName,
    tagline: doc.tagline,
    subTagline: doc.subTagline,
    logoTagline: doc.logoTagline,
    logoSubTagline: doc.logoSubTagline,
    logoUrl: doc.logoUrl || "",
    heroTitle: doc.heroTitle,
    heroHighlight: doc.heroHighlight,
    heroSubtitle: doc.heroSubtitle,
    accentColor: doc.accentColor || COLORS.electricOrange,
    hiddenProductSlugs: doc.hiddenProductSlugs || [],
  };
}

export async function getSiteSettings(): Promise<SiteSettingsType> {
  try {
    await connectDB();
    const raw = await SiteSettings.findOne({ key: "main" }).lean();
    if (!raw) return DEFAULT_SITE_SETTINGS;
    return mapSettings(raw as unknown as ISiteSettings);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function getHiddenProductSlugs(): Promise<Set<string>> {
  const settings = await getSiteSettings();
  return new Set(settings.hiddenProductSlugs || []);
}

export async function hideProductSlug(slug: string): Promise<void> {
  await connectDB();
  const existing = await SiteSettings.findOne({ key: "main" }).lean();
  const hidden = new Set([
    ...(existing?.hiddenProductSlugs as string[] | undefined) || [],
    slug,
  ]);
  await SiteSettings.findOneAndUpdate(
    { key: "main" },
    {
      key: "main",
      ...DEFAULT_SITE_SETTINGS,
      ...(existing ? mapSettings(existing as unknown as ISiteSettings) : {}),
      hiddenProductSlugs: [...hidden],
    },
    { upsert: true, new: true }
  );
}

export async function unhideProductSlug(slug: string): Promise<void> {
  await connectDB();
  const existing = await SiteSettings.findOne({ key: "main" }).lean();
  if (!existing) return;
  const hidden = (existing.hiddenProductSlugs as string[] | undefined) || [];
  await SiteSettings.findOneAndUpdate(
    { key: "main" },
    { hiddenProductSlugs: hidden.filter((s) => s !== slug) },
    { new: true }
  );
}
