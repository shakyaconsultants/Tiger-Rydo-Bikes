import type { Product } from "@/lib/types";
import { KEY_FEATURE_LABELS, normalizeBrochure, SPEC_ICON_CATEGORIES, speedCategoryLabel } from "@/lib/brochure";
import { getLowestPrice } from "@/lib/product-utils";

type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;
type Rect = { x: number; y: number; w: number; h: number };
type GalleryItem = { src: string; caption: string };

// ─── Design Tokens ──────────────────────────────────────────────────────────
const MARGIN = 16;
const ACCENT: [number, number, number] = [255, 90, 0];
const TEXT_PRIMARY: [number, number, number] = [17, 17, 17];
const TEXT_SECONDARY: [number, number, number] = [102, 102, 102];
const BG: [number, number, number] = [255, 255, 255];
const DIVIDER: [number, number, number] = [230, 230, 230];
const PANEL_DARK: [number, number, number] = [23, 19, 15];
const CARD_RADIUS = 3;
const DIVIDER_WEIGHT = 0.3;
const ICON_STROKE = 0.7;
const ICON_RADIUS_SM = 3.4;
const ICON_RADIUS_LG = 7.2;

function g(steps: number): number { return steps * 2.82; }

// ─── Utilities ──────────────────────────────────────────────────────────────
function formatPrice(price: number): string {
  return `Rs. ${new Intl.NumberFormat("en-IN").format(price)}`;
}

function slugifyFilename(name: string): string {
  return name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "brochure";
}

async function fetchImage(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onloadend = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

function imgFmt(d: string): "PNG" | "JPEG" { return d.startsWith("data:image/png") ? "PNG" : "JPEG"; }

async function imgSize(d: string): Promise<{ w: number; h: number }> {
  return new Promise((res) => {
    const i = new Image();
    i.onload = () => res({ w: i.naturalWidth || 1, h: i.naturalHeight || 1 });
    i.onerror = () => res({ w: 1, h: 1 });
    i.src = d;
  });
}

async function drawImg(doc: JsPdfDoc, data: string, rect: Rect, cover = false) {
  const { w, h } = await imgSize(data);
  const s = cover ? Math.max(rect.w / w, rect.h / h) : Math.min(rect.w / w, rect.h / h);
  const dw = w * s, dh = h * s;
  doc.addImage(data, imgFmt(data), rect.x + (rect.w - dw) / 2, rect.y + (rect.h - dh) / 2, dw, dh);
}

function wrap(doc: JsPdfDoc, text: string, width: number, max?: number): string[] {
  const lines = doc.splitTextToSize(text, width) as string[];
  return max ? lines.slice(0, max) : lines;
}

function clamp(doc: JsPdfDoc, text: string, width: number): string {
  const t = text.trim();
  if (!t || doc.getTextWidth(t) <= width) return t;
  let o = t;
  while (o.length > 1 && doc.getTextWidth(o + "...") > width) o = o.slice(0, -1);
  return o + "...";
}

function safeArea(doc: JsPdfDoc): Rect {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  return { x: MARGIN, y: MARGIN, w: pw - MARGIN * 2, h: ph - MARGIN * 2 };
}

// ─── Logo ───────────────────────────────────────────────────────────────────
let _logo: string | null | undefined;
async function getLogo(): Promise<string | null> {
  if (_logo !== undefined) return _logo;
  _logo = await fetchImage("/images/tiger logo.png");
  return _logo;
}

// ─── Branding — identical on every page ─────────────────────────────────────
const LOGO_W = g(13);
const LOGO_H = g(5.4);
const LOGO_TOP_MARGIN = g(0.5);

async function drawBranding(doc: JsPdfDoc, s: Rect) {
  const logo = await getLogo();
  if (logo) {
    await drawImg(doc, logo, { x: s.x, y: s.y - LOGO_TOP_MARGIN, w: LOGO_W, h: LOGO_H });
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text("TIGER EBIKES", s.x, s.y + g(1.5));
  }
}

// ─── Footer — identical on every page ───────────────────────────────────────
function drawFooter(doc: JsPdfDoc, s: Rect, brand: string, website: string) {
  const y = s.y + s.h + g(0.5);
  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(DIVIDER_WEIGHT);
  doc.line(s.x, y, s.x + s.w, y);

  const ty = y + g(1.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(brand, s.x, ty);
  doc.text(website || "tigerebikes.com", s.x + s.w, ty, { align: "right" });
  doc.text(`(c) ${new Date().getFullYear()} ${brand}`, s.x + s.w / 2, ty, { align: "center" });
}

// ─── Soft Shadow ────────────────────────────────────────────────────────────
function drawSoftShadow(doc: JsPdfDoc, cx: number, y: number, w: number) {
  for (let i = 0; i < 5; i++) {
    const alpha = 10 - i * 2;
    doc.setFillColor(0, 0, 0);
    doc.setGState(new (doc as any).GState({ opacity: alpha / 100 }));
    doc.ellipse(cx, y + i * 0.35, w * 0.40 - i * 1.8, 2.0 - i * 0.25, "F");
  }
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
}

// ─── Page background ────────────────────────────────────────────────────────
function fillPage(doc: JsPdfDoc) {
  doc.setFillColor(...BG);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 1: COVER
// ═══════════════════════════════════════════════════════════════════════════
async function renderCover(doc: JsPdfDoc, product: Product, brochure: ReturnType<typeof normalizeBrochure>, coverImage: string | null) {
  const s = safeArea(doc);
  const brand = brochure.brandName || "Tiger Ebikes";
  const price = formatPrice(getLowestPrice(product));

  fillPage(doc);
  await drawBranding(doc, s);

  // Eyebrow tagline
  let y = s.y + g(8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text((brochure.coverTagline || "Clean Energy Commuting").toUpperCase(), s.x, y);

  // Model name — extra gap to avoid overlap with eyebrow
  y += g(6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text((product.name || "MODEL").toUpperCase(), s.x, y);

  // Sub-tagline — extra gap below large model name
  y += g(4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(product.tagline || "Elegance Electrified", s.x, y);

  // Hero scooter — floating, centered, ~70% page
  if (coverImage) {
    const heroW = s.w * 0.82;
    const heroH = s.h - g(34);
    const heroX = s.x + (s.w - heroW) / 2;
    const heroY = s.y + g(24);

    drawSoftShadow(doc, heroX + heroW / 2, heroY + heroH + g(0.5), heroW);
    await drawImg(doc, coverImage, { x: heroX, y: heroY, w: heroW, h: heroH });
  }

  // Price — bottom left
  const bottomY = s.y + s.h - g(2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text("Starting at", s.x, bottomY - g(2.5));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...ACCENT);
  doc.text(price, s.x, bottomY);

  // Speed — bottom right
  const speed = speedCategoryLabel(brochure.speedCategory).toUpperCase();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(speed, s.x + s.w, bottomY, { align: "right" });

  drawFooter(doc, s, brand, brochure.website || "");
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 2: PRODUCT STORY
// ═══════════════════════════════════════════════════════════════════════════
async function renderStory(
  doc: JsPdfDoc,
  product: Product,
  brochure: ReturnType<typeof normalizeBrochure>,
  coverImage: string | null,
  gallery: GalleryItem[]
) {
  doc.addPage();
  const s = safeArea(doc);
  const brand = brochure.brandName || "Tiger Ebikes";

  fillPage(doc);
  await drawBranding(doc, s);

  const leftW = s.w * 0.46;
  const gapX = s.w * 0.52;
  const rightX = s.x + gapX;
  const rightW = s.w - gapX;

  // LEFT: Title
  let ly = s.y + g(8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text((product.name || "MODEL").toUpperCase(), s.x, ly);

  // Orange accent line
  ly += g(2);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(s.x, ly, s.x + g(8), ly);

  // Description
  ly += g(3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_SECONDARY);
  const desc = wrap(doc, brochure.shortDescription || product.description || "Built for clean urban mobility.", leftW, 7);
  doc.text(desc, s.x, ly);
  ly += desc.length * g(1.8) + g(3);

  // 3 Feature cards with consistent spacing
  const features = brochure.highlightFeatures.length >= 3
    ? brochure.highlightFeatures.slice(0, 3)
    : ["Efficient Batteries", "Hydraulic Suspension", "Quick Charge"];
  const featureSubs = ["Long range lithium power", "Smooth urban rides", "Get going in minutes"];
  const featureSpacing = g(7);

  features.forEach((feat, i) => {
    const fy = ly + i * featureSpacing;

    // Icon circle — consistent size and stroke
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(ICON_STROKE);
    doc.circle(s.x + g(1.8), fy + g(0.5), ICON_RADIUS_SM, "S");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text(feat, s.x + g(5), fy);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(featureSubs[i] || "Premium feature", s.x + g(5), fy + g(2));

    // Divider — does not touch text (g(1.5) gap)
    if (i < features.length - 1) {
      doc.setDrawColor(...DIVIDER);
      doc.setLineWidth(DIVIDER_WEIGHT);
      doc.line(s.x + g(5), fy + g(4.5), s.x + leftW, fy + g(4.5));
    }
  });

  // RIGHT: Large floating scooter
  if (coverImage) {
    const imgTop = s.y + g(8);
    const imgH = s.h * 0.48;
    drawSoftShadow(doc, rightX + rightW / 2, imgTop + imgH + g(0.5), rightW);
    await drawImg(doc, coverImage, { x: rightX, y: imgTop, w: rightW, h: imgH });
  }

  // Gallery thumbnails below scooter
  if (gallery.length > 0) {
    const galY = s.y + g(8) + s.h * 0.48 + g(4);
    const galCols = Math.min(gallery.length, 3);
    const galGap = g(1.5);
    const galItemW = (rightW - galGap * (galCols - 1)) / galCols;
    const galItemH = g(9);

    for (let i = 0; i < galCols; i++) {
      const gx = rightX + i * (galItemW + galGap);

      doc.setFillColor(248, 248, 248);
      doc.roundedRect(gx, galY, galItemW, galItemH, 2, 2, "F");
      await drawImg(doc, gallery[i].src, {
        x: gx + 1.5,
        y: galY + 1.5,
        w: galItemW - 3,
        h: galItemH - g(2.5),
      });

      if (gallery[i].caption.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...TEXT_SECONDARY);
        doc.text(
          clamp(doc, gallery[i].caption, galItemW - 4),
          gx + galItemW / 2,
          galY + galItemH - g(0.5),
          { align: "center" }
        );
      }
    }
  }

  // Color swatches — actual circles with labels
  const swatchY = s.y + s.h - g(5);
  const swatches = [
    { name: "Wine Red", c: [149, 12, 12] as [number, number, number] },
    { name: "Silver White", c: [235, 235, 228] as [number, number, number] },
    { name: "Carbon Black", c: [30, 30, 30] as [number, number, number] },
    { name: "Metallic Grey", c: [158, 158, 158] as [number, number, number] },
  ];
  const swatchSpacing = g(5.5);
  const swatchRadius = g(1.1);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text("AVAILABLE COLORS", rightX, swatchY - g(1.5));

  swatches.forEach((sw, i) => {
    const cx = rightX + i * swatchSpacing + swatchRadius;
    // Filled circle
    doc.setFillColor(...sw.c);
    doc.circle(cx, swatchY + swatchRadius, swatchRadius, "F");
    // Thin border
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(DIVIDER_WEIGHT);
    doc.circle(cx, swatchY + swatchRadius, swatchRadius, "S");
    // Label below
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(sw.name, cx, swatchY + swatchRadius * 2 + g(1.2), { align: "center" });
  });

  drawFooter(doc, s, brand, brochure.website || "");
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 3: SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════
async function renderSpecs(doc: JsPdfDoc, brochure: ReturnType<typeof normalizeBrochure>) {
  doc.addPage();
  const s = safeArea(doc);
  const brand = brochure.brandName || "Tiger Ebikes";

  fillPage(doc);
  await drawBranding(doc, s);

  let y = s.y + g(8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text("SPECIFICATIONS", s.x, y);

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(s.x, y + g(1.2), s.x + g(8), y + g(1.2));

  // 4 spec cards — 2x2 grid, identical dimensions
  const cardGap = g(3);
  const cardW = (s.w - cardGap) / 2;
  const cardH = g(18);
  const cardPad = g(2.5);
  const cardTop = y + g(4.5);

  const sections = [
    { title: "POWERTRAIN", rows: [
      { l: "Motor", v: brochure.motor }, { l: "Speed", v: brochure.speed },
      { l: "Chassis", v: brochure.chassis }, { l: "Suspension", v: brochure.suspension },
    ]},
    { title: "BATTERY & ELECTRICAL", rows: [
      { l: "Battery", v: brochure.battery }, { l: "Charger", v: brochure.charger },
      { l: "Charging (Lithium)", v: brochure.chargingTimeLithium },
      { l: "Charging (Lead Acid)", v: brochure.chargingTimeLeadAcid },
      { l: "Head Light", v: brochure.headLight },
    ]},
    { title: "RIDE & COMFORT", rows: [
      { l: "Brake System", v: brochure.brakeSystem }, { l: "Tyre", v: brochure.tyre },
      { l: "Tyre Size", v: `${brochure.tyreSizeFront || ""} / ${brochure.tyreSizeRear || ""}`.replace(/^\s*\/\s*$/, "-") },
      { l: "Weight", v: brochure.weight },
    ]},
    { title: "SAFETY & FEATURES", rows: KEY_FEATURE_LABELS.map(({ key, label }) => ({
      l: label, v: brochure.keyFeatures[key] ? "Yes" : "--",
    }))},
  ];

  sections.forEach((sec, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = s.x + col * (cardW + cardGap);
    const cy = cardTop + row * (cardH + cardGap);

    // Card with consistent border and radius
    doc.setFillColor(...BG);
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(DIVIDER_WEIGHT);
    doc.roundedRect(cx, cy, cardW, cardH, CARD_RADIUS, CARD_RADIUS, "FD");

    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    doc.text(sec.title, cx + cardPad, cy + g(2.8));

    // Divider under title
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(DIVIDER_WEIGHT);
    doc.line(cx + cardPad, cy + g(4), cx + cardW - cardPad, cy + g(4));

    // Rows — consistent vertical rhythm
    const rowSpacing = g(3);
    let ry = cy + g(6);
    sec.rows.forEach((r) => {
      if (!r.v?.trim() || ry > cy + cardH - g(2.5)) return;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_SECONDARY);
      doc.text(r.l, cx + cardPad, ry);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_PRIMARY);
      doc.text(clamp(doc, r.v, cardW * 0.42), cx + cardW - cardPad, ry, { align: "right" });

      ry += rowSpacing;
    });
  });

  // Feature icon grid — 2 rows x 4 columns with uploaded images
  const iconTop = cardTop + cardH * 2 + cardGap * 2 + g(1.5);
  const iconCols = 4;
  const iconCellW = s.w / iconCols;
  const iconRowH = g(10.5);
  const iconRadius = ICON_RADIUS_LG;
  const iconImgSize = iconRadius * 1.45;

  const iconEntries = await Promise.all(
    SPEC_ICON_CATEGORIES.map(async (cat) => {
      const url = brochure.specIconImages?.[cat.key] || "";
      const src = url ? await fetchImage(url) : null;
      return { label: cat.label, src };
    })
  );

  for (let i = 0; i < iconEntries.length; i++) {
    const col = i % iconCols;
    const row = Math.floor(i / iconCols);
    const ix = s.x + col * iconCellW + iconCellW / 2;
    const iy = iconTop + row * iconRowH;
    const circleY = iy + g(2.2);

    // Soft fill behind icon
    doc.setFillColor(250, 250, 250);
    doc.circle(ix, circleY, iconRadius, "F");

    if (iconEntries[i].src) {
      await drawImg(doc, iconEntries[i].src!, {
        x: ix - iconImgSize / 2,
        y: circleY - iconImgSize / 2,
        w: iconImgSize,
        h: iconImgSize,
      });
    }

    // Orange circle stroke
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(ICON_STROKE);
    doc.circle(ix, circleY, iconRadius, "S");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_PRIMARY);
    const lines = wrap(doc, iconEntries[i].label, iconCellW - g(1.5), 2);
    doc.text(lines, ix, circleY + iconRadius + g(1.8), { align: "center" });
  }

  drawFooter(doc, s, brand, brochure.website || "");
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 4: COMPANY
// ═══════════════════════════════════════════════════════════════════════════
async function renderCompany(
  doc: JsPdfDoc,
  product: Product,
  brochure: ReturnType<typeof normalizeBrochure>,
  coverImage: string | null
) {
  doc.addPage();
  const s = safeArea(doc);
  const brand = brochure.brandName || "Tiger Ebikes";
  const price = formatPrice(getLowestPrice(product));

  fillPage(doc);
  await drawBranding(doc, s);

  // Large centered logo
  const logo = await getLogo();
  if (logo) {
    await drawImg(doc, logo, { x: s.x + s.w / 2 - g(11), y: s.y + g(6), w: g(22), h: g(9) });
  }

  // Mission
  let y = s.y + g(19);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text("OUR MISSION", s.x, y);
  y += g(2.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_SECONDARY);
  const missionLines = wrap(doc, brochure.mission || "Build clean and premium electric mobility for everyday riders.", s.w * 0.75, 3);
  doc.text(missionLines, s.x, y);

  // About
  y += missionLines.length * g(1.8) + g(3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text("ABOUT US", s.x, y);
  y += g(2.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  const aboutLines = wrap(doc, brochure.companyDescription || "Electric two-wheeler brand focused on sustainability and rider comfort.", s.w * 0.75, 6);
  doc.text(aboutLines, s.x, y);

  // Dark contact card
  y += aboutLines.length * g(1.6) + g(4);
  const contactH = g(15);
  doc.setFillColor(...PANEL_DARK);
  doc.roundedRect(s.x, y, s.w, contactH, CARD_RADIUS, CARD_RADIUS, "F");

  const cardPad = g(3);
  let cy = y + g(3);
  const contactItems = [
    { label: "Website", value: brochure.website || "tigerebikes.com" },
    { label: "Email", value: brochure.email || "info@tigerebikes.com" },
    { label: "Phone", value: brochure.phone || "+91 9125158769" },
    { label: "Address", value: brochure.address || "33, Hamirpur Rd, Keshav Nagar, Saket Nagar, Kanpur, UP 208014" },
  ];

  contactItems.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...ACCENT);
    doc.text(item.label, s.x + cardPad, cy);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 220);
    doc.text(clamp(doc, item.value, s.w * 0.38), s.x + cardPad + g(11), cy);

    cy += g(3);
  });

  // QR code — right side of dark card with border and label
  const qrSize = g(8);
  const qrPad = g(1);
  const qrX = s.x + s.w - cardPad - qrSize;
  const qrY = y + g(2.5);

  const qrUrl = brochure.qrCodeUrl
    || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(brochure.website || "https://tigerebikes.com")}`;
  const qrImg = await fetchImage(qrUrl);
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(DIVIDER_WEIGHT);
  doc.roundedRect(qrX - qrPad, qrY - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2, 2, 2, "S");
  if (qrImg) {
    await drawImg(doc, qrImg, { x: qrX, y: qrY, w: qrSize, h: qrSize });
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(200, 200, 200);
  doc.text("Scan to Explore", qrX + qrSize / 2, qrY + qrSize + g(2), { align: "center" });

  // Product thumbnail — bottom right with shadow
  const prodY = y + contactH + g(3);
  if (coverImage) {
    const thumbW = g(15);
    const thumbH = g(11);
    const thumbX = s.x + s.w - thumbW;

    drawSoftShadow(doc, thumbX + thumbW / 2, prodY + thumbH + g(0.3), thumbW * 0.8);
    await drawImg(doc, coverImage, { x: thumbX, y: prodY, w: thumbW, h: thumbH });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text((product.name || "MODEL").toUpperCase(), thumbX, prodY + thumbH + g(2));

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...ACCENT);
    doc.text(price, thumbX, prodY + thumbH + g(4.5));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(product.tagline || "Clean Energy Commuting", thumbX, prodY + thumbH + g(6.5));
  }

  // Social links — bottom left
  const socials = brochure.socialLinks.length ? brochure.socialLinks.join("  ·  ") : "Instagram  ·  Facebook  ·  YouTube";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(socials, s.x, prodY + g(5));

  // Founded year tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text("Powering clean mobility since 2024", s.x, prodY + g(7));

  drawFooter(doc, s, brand, brochure.website || "");
}

// ─── Gallery Continuation Pages ─────────────────────────────────────────────
async function renderGalleryPages(doc: JsPdfDoc, gallery: GalleryItem[], brochure: ReturnType<typeof normalizeBrochure>) {
  if (gallery.length === 0) return;
  const brand = brochure.brandName || "Tiger Ebikes";
  let remaining = gallery;

  while (remaining.length > 0) {
    doc.addPage();
    const s = safeArea(doc);
    fillPage(doc);
    await drawBranding(doc, s);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text("GALLERY", s.x, s.y + g(8));

    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.8);
    doc.line(s.x, s.y + g(9.2), s.x + g(5), s.y + g(9.2));

    const cols = 3;
    const galGap = g(2);
    const tileW = (s.w - galGap * (cols - 1)) / cols;
    const tileH = g(11);
    const rowH = tileH + g(3.5);
    const startY = s.y + g(12);
    const maxRows = Math.floor((s.h - g(16)) / rowH);
    const maxItems = cols * maxRows;

    const batch = remaining.slice(0, maxItems);
    remaining = remaining.slice(maxItems);

    for (let i = 0; i < batch.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = s.x + col * (tileW + galGap);
      const ty = startY + row * rowH;

      doc.setFillColor(248, 248, 248);
      doc.roundedRect(tx, ty, tileW, tileH, 2, 2, "F");
      await drawImg(doc, batch[i].src, { x: tx + 1.5, y: ty + 1.5, w: tileW - 3, h: tileH - g(2.5) });

      if (batch[i].caption.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...TEXT_SECONDARY);
        doc.text(clamp(doc, batch[i].caption, tileW - 4), tx + tileW / 2, ty + tileH - g(0.4), { align: "center" });
      }
    }

    drawFooter(doc, s, brand, brochure.website || "");
  }
}

// ─── Main Renderer ──────────────────────────────────────────────────────────
async function renderBrochurePageSet(doc: JsPdfDoc, product: Product) {
  const brochure = normalizeBrochure(product.brochure);
  const coverImage = product.imageUrl ? await fetchImage(product.imageUrl) : null;
  const gallery = (
    await Promise.all(brochure.galleryImages.map(async (gi) => ({ src: await fetchImage(gi.url), caption: gi.caption })))
  )
    .filter((x): x is GalleryItem => Boolean(x.src))
    .map((x) => ({ src: x.src!, caption: x.caption || "" }));

  await renderCover(doc, product, brochure, coverImage);
  await renderStory(doc, product, brochure, coverImage, gallery.slice(0, 3));
  await renderSpecs(doc, brochure);
  await renderCompany(doc, product, brochure, coverImage);
  await renderGalleryPages(doc, gallery.slice(3), brochure);
}

export async function downloadProductsBrochurePdf(product: Product) {
  const brochure = normalizeBrochure(product.brochure);
  if (!brochure.enabled) {
    throw new Error(`Turn on "Include in brochure PDF" for ${product.name || "this e-bike"} first.`);
  }
  if (!product.name?.trim()) {
    throw new Error("Save the e-bike with a name before downloading the brochure.");
  }
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await renderBrochurePageSet(doc, product);
  doc.save(`${slugifyFilename(product.name)}.pdf`);
}
