import type { ProductBrochure } from "@/lib/types";

export const SPEED_CATEGORY_OPTIONS = [
  { value: "slow_speed", label: "Slow Speed" },
  { value: "medium_speed", label: "Medium Speed" },
  { value: "high_speed", label: "High Speed" },
] as const;

export const BRAKE_SYSTEM_OPTIONS = [
  "Disc / Drum",
  "Disc",
  "Drum",
  "Disc / Disc",
] as const;

export const BATTERY_TYPE_OPTIONS = [
  "Lead Acid / Lithium",
  "Lithium",
  "Lead Acid",
] as const;

export const SPEEDOMETER_OPTIONS = [
  "Digital Colour",
  "Digital",
  "Analog",
] as const;

export const HEADLIGHT_OPTIONS = [
  "LED Headlamp",
  "Halogen Headlamp",
  "LED with DRL",
] as const;

export const TYRE_OPTIONS = [
  "Tubeless Tyre",
  "Tube Tyre",
] as const;

export const DEFAULT_HIGHLIGHT_FEATURES = [
  "Efficient Batteries",
  "Quick Charge",
  "Hydraulic Suspension",
  "Digital Meter",
  "Bright Headlamp",
  "USB Charging Port",
  "Disc/Drum Brake",
  "Tubeless Tyre",
];

export const KEY_FEATURE_LABELS: { key: keyof ProductBrochure["keyFeatures"]; label: string }[] = [
  { key: "antiTheftAlarm", label: "Anti Theft Alarm" },
  { key: "centralLocking", label: "Central Locking" },
  { key: "parkingSwitch", label: "Parking Switch" },
  { key: "reverseGear", label: "Reverse Gear" },
  { key: "usbCharger", label: "USB Charger" },
];

export function defaultBrochure(): ProductBrochure {
  return {
    enabled: false,
    coverTagline: "CLEAN ENERGY COMMUTING",
    brandName: "Tiger Ebikes",
    logoUrl: "",
    speedCategory: "slow_speed",
    shortDescription: "",
    colors: [],
    galleryImages: [],
    mission: "Build clean, bold and reliable electric mobility for everyday riders.",
    companyDescription:
      "Tiger Ebikes designs premium electric two-wheelers for modern city mobility with a focus on comfort, safety, and sustainability.",
    address: "33, Hamirpur Rd, Keshav Nagar, W Block, Juhi Kalan, Saket Nagar, Kanpur, Uttar Pradesh 208014",
    phone: "+91 9125158769",
    email: "info@tigerebikes.com",
    website: "https://tigerebikes.com",
    qrCodeUrl: "",
    socialLinks: [],
    motor: "Highly Insulated BLDC Motor",
    speed: "Slow Speed",
    chassis: "High Strength Tubular Frame",
    suspension: "Front Hydraulic",
    otherFeature: "Telescopic Rear Double Shocker with Dual Tube",
    keyFeatures: {
      antiTheftAlarm: true,
      centralLocking: true,
      parkingSwitch: true,
      reverseGear: true,
      usbCharger: true,
    },
    brakeSystem: "Disc / Drum",
    tyre: "Tubeless Tyre",
    tyreSizeFront: '10"',
    tyreSizeRear: '10"',
    weight: "100 Kg",
    speedometer: "Digital Colour",
    battery: "Lead Acid / Lithium",
    charger: "Micro Charger with Auto Cutoff",
    chargingTimeLithium: "3-5 hrs",
    chargingTimeLeadAcid: "6-8 hrs",
    headLight: "LED Headlamp",
    highlightFeatures: [...DEFAULT_HIGHLIGHT_FEATURES],
  };
}

export function normalizeBrochure(input?: Partial<ProductBrochure> | null): ProductBrochure {
  const base = defaultBrochure();
  if (!input) return base;
  const legacy = input as Partial<ProductBrochure> & { galleryImageUrls?: unknown };

  const galleryFromNew = Array.isArray(input.galleryImages)
    ? input.galleryImages
        .map((item) => ({
          url: String(item?.url || "").trim(),
          caption: String(item?.caption || "").trim(),
        }))
        .filter((item) => item.url)
    : [];

  const galleryFromLegacy = Array.isArray(legacy.galleryImageUrls)
    ? legacy.galleryImageUrls
        .map((u) => ({ url: String(u || "").trim(), caption: "" }))
        .filter((item) => item.url)
    : [];

  const rawWebsite = String(input.website ?? base.website).trim();
  const rawBrand = String(input.brandName ?? base.brandName).trim();
  const rawCompany = String(input.companyDescription ?? base.companyDescription).trim();
  const rawAddress = String(input.address ?? base.address).trim();
  const rawPhone = String(input.phone ?? base.phone).trim();
  const rawEmail = String(input.email ?? base.email).trim();

  const website = /tigerrydo/i.test(rawWebsite) || !rawWebsite
    ? base.website
    : rawWebsite;
  const brandName = /tiger\s*rydo/i.test(rawBrand) || !rawBrand
    ? base.brandName
    : rawBrand;
  const companyDescription = /tiger\s*rydo/i.test(rawCompany)
    ? base.companyDescription
    : rawCompany;

  return {
    ...base,
    ...input,
    brandName,
    colors: Array.isArray(input.colors)
      ? input.colors.map((c) => String(c).trim()).filter(Boolean)
      : base.colors,
    galleryImages: galleryFromNew.length > 0 ? galleryFromNew : galleryFromLegacy,
    mission: String(input.mission ?? base.mission).trim(),
    companyDescription,
    address: rawAddress || base.address,
    phone: rawPhone || base.phone,
    email: rawEmail || base.email,
    website,
    qrCodeUrl: String(input.qrCodeUrl ?? base.qrCodeUrl).trim(),
    socialLinks: Array.isArray(input.socialLinks)
      ? input.socialLinks.map((s) => String(s).trim()).filter(Boolean)
      : base.socialLinks,
    highlightFeatures: Array.isArray(input.highlightFeatures)
      ? input.highlightFeatures.map((f) => String(f).trim()).filter(Boolean)
      : base.highlightFeatures,
    keyFeatures: {
      ...base.keyFeatures,
      ...(input.keyFeatures || {}),
    },
    speedCategory:
      input.speedCategory === "medium_speed" || input.speedCategory === "high_speed"
        ? input.speedCategory
        : "slow_speed",
  };
}

export function speedCategoryLabel(value: ProductBrochure["speedCategory"]): string {
  return SPEED_CATEGORY_OPTIONS.find((o) => o.value === value)?.label ?? "Slow Speed";
}
