export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const withCountry = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function dealershipWhatsAppMessage(dealerName: string): string {
  return `Hi ${dealerName}, I'm interested in becoming a Tiger Rydo dealer. Please share dealership details.`;
}

export function productInquiryMessage(productName: string, variantName: string): string {
  return `Hi, I'm interested in the ${productName} (${variantName}). Please share pricing and availability.`;
}
