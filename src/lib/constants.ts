import type { Product, Dealer } from "./types";


export const BRAND = {
  name: "TIGER",
  fullName: "TIGER RYDO",
  tagline: "BUILT FOR THE CITY.",
  subTagline: "Smart. Clean. Electric.",
  logoTagline: "E-POWERED. FUTURE READY.",
  logoSubTagline: "E-SCOOTY & BIKE COMPANY",
  promise: "Designed for the city. Built to move.",
  motto: "Ride Bold. Ride Clean. Ride Future.",
} as const;

export const COLORS = {
  onyxBlack: "#0A0A0A",
  charcoalBlack: "#111111",
  graphiteGrey: "#2B2B2B",
  steelGray: "#7A7A7A",
  silver: "#E6E6E6",
  pureWhite: "#FFFFFF",
  electricOrange: "#FF5A00",
  limeGreen: "#A6FF00",
  neonBlue: "#00B2FF",
  safetyYellow: "#FFD600",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home"},
  { href: "/products", label: "Products" },
  { href: "/dealers", label: "Dealers" },
  // { href: "/#battery", label: "Battery & Range" },
  // { href: "/#smart-connect", label: "Smart Connect" },
  { href: "/#contact", label: "Contact" },
] as const;

export const VALUES = [
  { icon: "bold", title: "BOLD", description: "Speaks with confidence." },
  { icon: "agile", title: "AGILE", description: "Moves fast and adapts quickly." },
  { icon: "urban", title: "URBAN", description: "Made for real city life." },
  { icon: "fearless", title: "FEARLESS", description: "Stands out without trying too hard." },
  { icon: "smart", title: "SMART", description: "Simple, functional, efficient." },
] as const;

export const SMART_FEATURES = [
  { title: "Dashboard", description: "Ride stats & analytics", icon: "gauge" },
  { title: "Scooter", description: "Live status & controls", icon: "scooter" },
  { title: "Map", description: "Last parked location", icon: "map" },
] as const;

export const FALLBACK_PRODUCTS: Product[] = [
  {
    _id: "tiger-e1",
    name: "Tiger E1",
    slug: "tiger-e1",
    tagline: "The city rider's choice",
    description:
      "Intelligent electric mobility designed for urban commuters who demand premium design, reliable performance, and a clean identity.",
    featured: false,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    batteryVariants: [
      {
        id: "e1-1.8",
        name: "1.8 kWh",
        capacity: "1.8 kWh",
        range: 65,
        price: 74999,
        chargeTime: "5 hrs",
        chargePercent: "0–80%",
        motor: "2.5 kW",
        parameters: [
          { label: "Top Speed", value: "55 km/h" },
          { label: "Range", value: "65 km" },
          { label: "Motor Power", value: "2.5 kW" },
          { label: "Battery Type", value: "Lithium-ion" },
          { label: "Charge Time", value: "0–80% in 5 hrs" },
          { label: "Brakes", value: "Disc (Front & Rear)" },
          { label: "Tyre Size", value: "10 inch" },
          { label: "Weight", value: "95 kg" },
          { label: "Smart Connect", value: "Basic App" },
        ],
      },
      {
        id: "e1-2.5",
        name: "2.5 kWh",
        capacity: "2.5 kWh",
        range: 85,
        price: 89999,
        chargeTime: "4.2 hrs",
        chargePercent: "0–80%",
        motor: "3.2 kW",
        parameters: [
          { label: "Top Speed", value: "65 km/h" },
          { label: "Range", value: "85 km" },
          { label: "Motor Power", value: "3.2 kW" },
          { label: "Battery Type", value: "Lithium-ion" },
          { label: "Charge Time", value: "0–80% in 4.2 hrs" },
          { label: "Brakes", value: "Disc (Front & Rear)" },
          { label: "Tyre Size", value: "10 inch" },
          { label: "Weight", value: "98 kg" },
          { label: "Smart Connect", value: "App Enabled" },
        ],
      },
      {
        id: "e1-3.2",
        name: "3.2 kWh",
        capacity: "3.2 kWh",
        range: 110,
        price: 99999,
        chargeTime: "3.8 hrs",
        chargePercent: "0–80%",
        motor: "4.0 kW",
        parameters: [
          { label: "Top Speed", value: "75 km/h" },
          { label: "Range", value: "110 km" },
          { label: "Motor Power", value: "4.0 kW" },
          { label: "Battery Type", value: "Lithium-ion" },
          { label: "Charge Time", value: "0–80% in 3.8 hrs" },
          { label: "Brakes", value: "Disc (Front & Rear)" },
          { label: "Tyre Size", value: "10 inch" },
          { label: "Weight", value: "102 kg" },
          { label: "Smart Connect", value: "Premium App" },
        ],
      },
    ],
  },
  {
    _id: "tiger-e1-pro",
    name: "Tiger E1 Pro",
    slug: "tiger-e1-pro",
    tagline: "Power meets control",
    description:
      "Enhanced performance for riders who want more range, more speed, and premium smart features built for the city.",
    featured: false,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    batteryVariants: [
      {
        id: "e1pro-3.2",
        name: "3.2 kWh",
        capacity: "3.2 kWh",
        range: 110,
        price: 109999,
        chargeTime: "3.8 hrs",
        chargePercent: "0–80%",
        motor: "4.0 kW",
        parameters: [
          { label: "Top Speed", value: "75 km/h" },
          { label: "Range", value: "110 km" },
          { label: "Motor Power", value: "4.0 kW" },
          { label: "Battery Type", value: "Lithium-ion" },
          { label: "Charge Time", value: "0–80% in 3.8 hrs" },
          { label: "Regenerative Braking", value: "Yes" },
          { label: "Riding Modes", value: "Eco / Sport / Hyper" },
          { label: "Smart Connect", value: "Premium App" },
        ],
      },
      {
        id: "e1pro-4.0",
        name: "4.0 kWh",
        capacity: "4.0 kWh",
        range: 130,
        price: 124999,
        chargeTime: "3.5 hrs",
        chargePercent: "0–80%",
        motor: "4.5 kW",
        parameters: [
          { label: "Top Speed", value: "80 km/h" },
          { label: "Range", value: "130 km" },
          { label: "Motor Power", value: "4.5 kW" },
          { label: "Battery Type", value: "Lithium-ion" },
          { label: "Charge Time", value: "0–80% in 3.5 hrs" },
          { label: "Regenerative Braking", value: "Yes" },
          { label: "Riding Modes", value: "Eco / Sport / Hyper" },
          { label: "Smart Connect", value: "Premium App + GPS" },
        ],
      },
    ],
  },
  {
    _id: "tiger-e1-lite",
    name: "Tiger E1 Lite",
    slug: "tiger-e1-lite",
    tagline: "Smart. Accessible. Electric.",
    description:
      "Entry-level electric mobility with Tiger's signature design and essential smart features for everyday city rides.",
    featured: false,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    batteryVariants: [
      {
        id: "e1lite-1.5",
        name: "1.5 kWh",
        capacity: "1.5 kWh",
        range: 55,
        price: 59999,
        chargeTime: "5.5 hrs",
        chargePercent: "0–80%",
        motor: "2.0 kW",
        parameters: [
          { label: "Top Speed", value: "45 km/h" },
          { label: "Range", value: "55 km" },
          { label: "Motor Power", value: "2.0 kW" },
          { label: "Battery Type", value: "Lithium-ion" },
          { label: "Charge Time", value: "0–80% in 5.5 hrs" },
          { label: "Brakes", value: "Drum (Front) / Disc (Rear)" },
          { label: "Smart Connect", value: "Basic App" },
        ],
      },
      {
        id: "e1lite-1.8",
        name: "1.8 kWh",
        capacity: "1.8 kWh",
        range: 65,
        price: 69999,
        chargeTime: "5 hrs",
        chargePercent: "0–80%",
        motor: "2.5 kW",
        parameters: [
          { label: "Top Speed", value: "55 km/h" },
          { label: "Range", value: "65 km" },
          { label: "Motor Power", value: "2.5 kW" },
          { label: "Battery Type", value: "Lithium-ion" },
          { label: "Charge Time", value: "0–80% in 5 hrs" },
          { label: "Brakes", value: "Disc (Front & Rear)" },
          { label: "Smart Connect", value: "Basic App" },
        ],
      },
    ],
  },
];

export const FALLBACK_DEALERS: Dealer[] = [
  {
    _id: "dealer-1",
    name: "Tiger Rydo — Mumbai Central",
    email: "mumbai@tigerrydo.com",
    phone: "+91 98765 43210",
    whatsapp: "919876543210",
    address: "12, Linking Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    isActive: true,
  },
  {
    _id: "dealer-2",
    name: "Tiger Rydo — Delhi South",
    email: "delhi@tigerrydo.com",
    phone: "+91 98765 43211",
    whatsapp: "919876543211",
    address: "45, Saket Main Road",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110017",
    isActive: true,
  },
  {
    _id: "dealer-3",
    name: "Tiger Rydo — Bangalore",
    email: "bangalore@tigerrydo.com",
    phone: "+91 98765 43212",
    whatsapp: "919876543212",
    address: "78, Indiranagar 100 Feet Road",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560038",
    isActive: true,
  },
  {
    _id: "dealer-4",
    name: "Tiger Rydo — Pune",
    email: "pune@tigerrydo.com",
    phone: "+91 98765 43213",
    whatsapp: "919876543213",
    address: "23, FC Road",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411004",
    isActive: true,
  },
];

/** Shared login for admin & dealer — password: admin123 */
export const PORTAL_CREDENTIALS = {
  email: "admin@tigerrydo.com",
  passwordHash: "$2b$10$s6aTu7XUASV2XGYQZ1LF0eTsZyUej4yIY95LFyRUMnrzasEIxqsoC",
};

export const DEMO_ADMIN = {
  email: PORTAL_CREDENTIALS.email,
  passwordHash: PORTAL_CREDENTIALS.passwordHash,
  session: {
    id: "portal-admin",
    name: "Tiger Rydo Admin",
    email: PORTAL_CREDENTIALS.email,
    city: "Head Office",
    role: "admin" as const,
  },
};

export const DEMO_DEALER = {
  email: PORTAL_CREDENTIALS.email,
  passwordHash: PORTAL_CREDENTIALS.passwordHash,
  session: {
    id: "portal-dealer",
    name: "Tiger Rydo Dealer",
    email: PORTAL_CREDENTIALS.email,
    city: "Mumbai",
    role: "dealer" as const,
  },
};

/** @deprecated Use FALLBACK_PRODUCTS */
export const FALLBACK_SCOOTERS = FALLBACK_PRODUCTS.map((p) => {
  const v = p.batteryVariants[0];
  return {
    _id: p._id,
    name: p.name,
    slug: p.slug,
    tagline: p.tagline,
    description: p.description,
    price: v.price,
    range: v.range,
    topSpeed: parseInt(v.parameters.find((x) => x.label === "Top Speed")?.value || "0"),
    chargeTime: v.chargeTime,
    chargePercent: v.chargePercent,
    battery: v.capacity,
    motor: v.motor,
    featured: p.featured,
    specs: [
      { label: "Range", value: `${v.range} KM` },
      { label: "Battery", value: v.capacity },
      { label: "Charge", value: `0–80% in ${v.chargeTime}` },
      { label: "Motor", value: v.motor },
    ],
  };
});

export const DEALERSHIP_WHATSAPP = {
  phone: "919876543210",
  label: "Apply for Dealership",
};
