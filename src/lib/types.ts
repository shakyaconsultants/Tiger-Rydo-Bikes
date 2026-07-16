export interface ProductParameter {
  label: string;
  value: string;
}

export interface BatteryVariant {
  id: string;
  name: string;
  capacity: string;
  range: number;
  price: number;
  chargeTime: string;
  chargePercent: string;
  motor: string;
  parameters: ProductParameter[];
}

export interface Product {
  _id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  featured: boolean;
  videoUrl: string;
  imageUrl?: string;
  batteryVariants: BatteryVariant[];
}

export interface Dealer {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isActive: boolean;
}

export type PortalRole = "admin" | "dealer";

export interface DealerSession {
  id: string;
  name: string;
  email: string;
  city: string;
  role: PortalRole;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled";

export interface Order {
  _id?: string;
  dealerId: string;
  dealerName: string;
  dealerEmail: string;
  dealerCity: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  status: OrderStatus;
  createdAt?: string;
}

export interface SiteSettings {
  brandName: string;
  fullName: string;
  tagline: string;
  subTagline: string;
  logoTagline: string;
  logoSubTagline: string;
  logoUrl: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  accentColor: string;
  hiddenProductSlugs?: string[];
}

export interface ListedProduct {
  _id?: string;
  name: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  listedProductId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface Inquiry {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  scooter?: string;
  scooterName?: string;
  message: string;
  type: "contact" | "test-ride" | "newsletter";
  createdAt?: string;
}
