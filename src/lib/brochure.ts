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
    speedCategory: "slow_speed",
    shortDescription: "",
    colors: [],
    galleryImageUrls: [],
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

  return {
    ...base,
    ...input,
    colors: Array.isArray(input.colors)
      ? input.colors.map((c) => String(c).trim()).filter(Boolean)
      : base.colors,
    galleryImageUrls: Array.isArray(input.galleryImageUrls)
      ? input.galleryImageUrls.map((u) => String(u).trim()).filter(Boolean)
      : base.galleryImageUrls,
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
