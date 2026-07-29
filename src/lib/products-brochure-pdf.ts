import type { Product } from "@/lib/types";
import { KEY_FEATURE_LABELS, normalizeBrochure, speedCategoryLabel } from "@/lib/brochure";
import { getLowestPrice } from "@/lib/product-utils";

type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;
type Rect = { x: number; y: number; w: number; h: number };
type GalleryItem = { src: string; caption: string };

// ─── Design Tokens ──────────────────────────────────────────────────────────
const MARGIN = 16; // 60px ≈ 16mm safe margin
const ACCENT: [number, number, number] = [255, 90, 0];
const TEXT_PRIMARY: [number, number, number] = [17, 17, 17];
const TEXT_SECONDARY: [number, number, number] = [102, 102, 102];
const BG: [number, number, number] = [255, 255, 255];
const DIVIDER: [number, number, number] = [230, 230, 230];
const PANEL_DARK: [number, number, number] = [23, 19, 15];

// 8-point spacing grid (in mm: 1mm ≈ 2.83px, so 8px ≈ 2.82mm)
function g(steps: number): number { return steps * 2.82; }

// ─── Utilities ──────────────────────────────────────────────────────────────
function formatRs(price: number): string {
  return `\u20B9${new Intl.NumberFormat("en-IN").format(price)}`;
}

function slugifyFilename(name: string): string {
  return name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "brochure";
}

async function fetchImage(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    return await new Promise((res) => { const fr = new FileReader(); fr.onloadend = () => res(fr.result as string); fr.readAsDataURL(blob); });
  } catch { return null; }
}

function imgFmt(d: string): "PNG" | "JPEG" { return d.startsWith("data:image/png") ? "PNG" : "JPEG"; }

async function imgSize(d: string): Promise<{ w: number; h: number }> {
  return new Promise((res) => { const i = new Image(); i.onload = () => res({ w: i.naturalWidth || 1, h: i.naturalHeight || 1 }); i.onerror = () => res({ w: 1, h: 1 }); i.src = d; });
}

async function drawImg(doc: JsPdfDoc, data: string, rect: Rect, cover = false) {
  const { w, h } = await imgSize(data);
  const s = cover ? Math.max(rect.w / w, rect.h / h) : Math.min(rect.w / w, rect.h / h);
  const dw = w * s, dh = h * s;
  doc.addImage(data, imgFmt(data), rect.x + (rect.w - dw) / 2, rect.y + (rect.h - dh) / 2, dw, dh);
}

function wrapText(doc: JsPdfDoc, text: string, width: number, max?: number): string[] {
  const lines = doc.splitTextToSize(text, width) as string[];
  return max ? lines.slice(0, max) : lines;
}

function clampLine(doc: JsPdfDoc, text: string, width: number): string {
  const t = text.trim();
  if (!t || doc.getTextWidth(t) <= width) return t;
  let o = t;
  while (o.length > 1 && doc.getTextWidth(o + "\u2026") > width) o = o.slice(0, -1);
  return o + "\u2026";
}

function safe(doc: JsPdfDoc): Rect {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  return { x: MARGIN, y: MARGIN, w: pw - MARGIN * 2, h: ph - MARGIN * 2 };
}

// ─── Logo Cache ─────────────────────────────────────────────────────────────
let _logo: string | null | undefined;
async function getLogo(): Promise<string | null> {
  if (_logo !== undefined) return _logo;
  _logo = await fetchImage("/images/tiger logo.png");
  return _logo;
}

// ─── Branding (every page) ──────────────────────────────────────────────────
async function drawBranding(doc: JsPdfDoc, s: Rect) {
  const logo = await getLogo();
  if (logo) {
    await drawImg(doc, logo, { x: s.x, y: s.y - g(1), w: g(12), h: g(5) });
  }
}

// ─── Soft Shadow Helper ─────────────────────────────────────────────────────
function drawSoftShadow(doc: JsPdfDoc, x: number, y: number, w: number, _h: number) {
  for (let i = 0; i < 4; i++) {
    const alpha = 12 - i * 3;
    doc.setFillColor(0, 0, 0);
    doc.setGState(new (doc as any).GState({ opacity: alpha / 100 }));
    doc.ellipse(x + w / 2, y + i * 0.4, w * 0.42 - i * 2, 2.2 - i * 0.3, "F");
  }
  doc.setGState(new (doc as any).GState({ opacity: 1 }));
}

// ─── PAGE 1: COVER ──────────────────────────────────────────────────────────
async function renderCover(doc: JsPdfDoc, product: Product, brochure: ReturnType<typeof normalizeBrochure>, coverImage: string | null) {
  const s = safe(doc);
  const price = formatRs(getLowestPrice(product));

  doc.setFillColor(...BG);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

  await drawBranding(doc, s);

  // Tagline eyebrow
  let y = s.y + g(8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text((brochure.coverTagline || "Clean Energy Commuting").toUpperCase(), s.x, y);

  // Model name — large editorial display
  y += g(5);
  const modelName = (product.name || "MODEL").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text(modelName, s.x, y);

  // Sub-tagline
  y += g(3.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(product.tagline || "Elegance Electrified", s.x, y);

  // Hero scooter — floating, ~70% of page, no box
  if (coverImage) {
    const heroTop = s.y + g(18);
    const heroH = s.h - g(28);
    const heroW = s.w * 0.85;
    const heroX = s.x + (s.w - heroW) / 2;

    drawSoftShadow(doc, heroX, heroTop + heroH - g(1), heroW, heroH);
    await drawImg(doc, coverImage, { x: heroX, y: heroTop, w: heroW, h: heroH });
  }

  // Price — bottom left, elegant
  const priceY = s.y + s.h - g(3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...ACCENT);
  doc.text(price, s.x, priceY);

  // Speed badge — bottom right, subtle
  const speed = speedCategoryLabel(brochure.speedCategory).toUpperCase();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(speed, s.x + s.w, priceY, { align: "right" });
}

// ─── PAGE 2: PRODUCT STORY ──────────────────────────────────────────────────
async function renderStory(
  doc: JsPdfDoc,
  product: Product,
  brochure: ReturnType<typeof normalizeBrochure>,
  coverImage: string | null,
  gallery: GalleryItem[]
) {
  doc.addPage();
  const s = safe(doc);
  doc.setFillColor(...BG);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
  await drawBranding(doc, s);

  const leftW = s.w * 0.48;
  const rightX = s.x + s.w * 0.52;
  const rightW = s.w * 0.48;

  // LEFT: Title
  let ly = s.y + g(8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text((product.name || "MODEL").toUpperCase(), s.x, ly);

  // Orange accent line
  ly += g(1.5);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(s.x, ly, s.x + g(8), ly);

  // Description
  ly += g(3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_SECONDARY);
  const desc = wrapText(doc, brochure.shortDescription || product.description || "Built for clean urban mobility.", leftW, 6);
  doc.text(desc, s.x, ly);

  // 3 Feature cards
  ly += g(12);
  const features = brochure.highlightFeatures.length >= 3
    ? brochure.highlightFeatures.slice(0, 3)
    : ["Efficient Batteries", "Hydraulic Suspension", "Quick Charge"];
  const subtitles = ["Long range lithium power", "Smooth urban rides", "Get going in minutes"];
  features.forEach((feat, i) => {
    const fy = ly + i * g(6);
    // Icon circle
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.circle(s.x + g(1.5), fy + g(0.3), g(1.2), "S");
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text(feat, s.x + g(4), fy);
    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(subtitles[i] || "Premium feature", s.x + g(4), fy + g(1.8));
    // Divider
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.3);
    doc.line(s.x + g(4), fy + g(3.5), s.x + leftW, fy + g(3.5));
  });

  // RIGHT: Large floating scooter
  if (coverImage) {
    const imgTop = s.y + g(8);
    const imgH = s.h * 0.5;
    drawSoftShadow(doc, rightX, imgTop + imgH - g(1), rightW, imgH);
    await drawImg(doc, coverImage, { x: rightX, y: imgTop, w: rightW, h: imgH });
  }

  // Gallery thumbnails on right (below scooter) with captions
  if (gallery.length > 0) {
    const galY = s.y + g(8) + s.h * 0.5 + g(3);
    const galCols = Math.min(gallery.length, 3);
    const galItemW = (rightW - g(1) * (galCols - 1)) / galCols;
    const galItemH = g(8);
    for (let i = 0; i < galCols; i++) {
      const gx = rightX + i * (galItemW + g(1));
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(gx, galY, galItemW, galItemH, 2, 2, "F");
      await drawImg(doc, gallery[i].src, { x: gx + 1, y: galY + 1, w: galItemW - 2, h: galItemH - g(2) });
      if (gallery[i].caption.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...TEXT_SECONDARY);
        doc.text(clampLine(doc, gallery[i].caption, galItemW - 2), gx + galItemW / 2, galY + galItemH - g(0.3), { align: "center" });
      }
    }
  }

  // Color swatches at bottom
  const swatchY = s.y + s.h - g(4);
  const swatches = [
    { name: "Wine Red", c: [149, 12, 12] as [number, number, number] },
    { name: "Ivory White", c: [240, 240, 230] as [number, number, number] },
    { name: "Metallic Black", c: [30, 30, 30] as [number, number, number] },
    { name: "Metallic Grey", c: [158, 158, 158] as [number, number, number] },
  ];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text("AVAILABLE COLORS", rightX, swatchY - g(1));
  swatches.forEach((sw, i) => {
    const cx = rightX + i * g(5);
    doc.setFillColor(...sw.c);
    doc.circle(cx + g(1), swatchY + g(1), g(0.9), "F");
    doc.setDrawColor(...DIVIDER);
    doc.circle(cx + g(1), swatchY + g(1), g(0.9), "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(sw.name, cx + g(1), swatchY + g(2.8), { align: "center" });
  });
}

// ─── PAGE 3: SPECIFICATIONS ─────────────────────────────────────────────────
function renderSpecs(doc: JsPdfDoc, brochure: ReturnType<typeof normalizeBrochure>) {
  doc.addPage();
  const s = safe(doc);
  doc.setFillColor(...BG);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

  // Branding drawn synchronously-safe (logo already cached by now)
  // We'll call drawBranding from the async wrapper

  // Title
  let y = s.y + g(8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...TEXT_PRIMARY);
  doc.text("SPECIFICATIONS", s.x, y);
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.line(s.x, y + g(1), s.x + g(8), y + g(1));

  // 4 premium spec cards in 2x2
  const cardW = (s.w - g(3)) / 2;
  const cardH = g(17);
  const cardStartY = y + g(4);

  const specSections = [
    {
      title: "POWERTRAIN",
      rows: [
        { l: "Motor", v: brochure.motor },
        { l: "Speed", v: brochure.speed },
        { l: "Chassis", v: brochure.chassis },
        { l: "Suspension", v: brochure.suspension },
      ],
    },
    {
      title: "BATTERY & ELECTRICAL",
      rows: [
        { l: "Battery", v: brochure.battery },
        { l: "Charger", v: brochure.charger },
        { l: "Charging (Lithium)", v: brochure.chargingTimeLithium },
        { l: "Charging (Lead Acid)", v: brochure.chargingTimeLeadAcid },
        { l: "Head Light", v: brochure.headLight },
      ],
    },
    {
      title: "RIDE & COMFORT",
      rows: [
        { l: "Brake System", v: brochure.brakeSystem },
        { l: "Tyre", v: brochure.tyre },
        { l: "Tyre Size", v: `${brochure.tyreSizeFront || ""} / ${brochure.tyreSizeRear || ""}`.replace(/^\s*\/\s*$/, "-") },
        { l: "Weight", v: brochure.weight },
      ],
    },
    {
      title: "SAFETY & FEATURES",
      rows: KEY_FEATURE_LABELS.map(({ key, label }) => ({
        l: label,
        v: brochure.keyFeatures[key] ? "Yes" : "—",
      })),
    },
  ];

  specSections.forEach((sec, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = s.x + col * (cardW + g(3));
    const cy = cardStartY + row * (cardH + g(3));

    // Card background with soft border
    doc.setFillColor(...BG);
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, cy, cardW, cardH, 3, 3, "FD");

    // Section heading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ACCENT);
    doc.text(sec.title, cx + g(2), cy + g(2.5));

    // Thin divider
    doc.setDrawColor(...DIVIDER);
    doc.setLineWidth(0.3);
    doc.line(cx + g(2), cy + g(3.5), cx + cardW - g(2), cy + g(3.5));

    // Rows
    let ry = cy + g(5.5);
    sec.rows.forEach((r) => {
      if (!r.v?.trim() || ry > cy + cardH - g(2)) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_SECONDARY);
      doc.text(r.l, cx + g(2), ry);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_PRIMARY);
      doc.text(clampLine(doc, r.v, cardW * 0.45), cx + cardW - g(2), ry, { align: "right" });

      ry += g(2.8);
    });
  });

  // Feature icon grid — 2 rows x 4 columns below cards
  const iconY = cardStartY + cardH * 2 + g(3) * 2 + g(2);
  const iconItems = brochure.highlightFeatures.length >= 8
    ? brochure.highlightFeatures.slice(0, 8)
    : ["Efficient Batteries", "Digital Meter", "Bright Headlamp", "Hydraulic Suspension", "USB Charging", "Disc Brake", "Quick Charge", "Tubeless Tyre"];
  const iconCols = 4;
  const iconCellW = s.w / iconCols;

  for (let i = 0; i < 8; i++) {
    const col = i % iconCols;
    const row = Math.floor(i / iconCols);
    const ix = s.x + col * iconCellW + iconCellW / 2;
    const iy = iconY + row * g(7);

    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.circle(ix, iy + g(1.5), g(1.5), "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_PRIMARY);
    const lines = wrapText(doc, iconItems[i] || "", iconCellW - g(1.5), 2);
    doc.text(lines, ix, iy + g(4), { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text("Standard", ix, iy + g(5.5), { align: "center" });
  }
}

// ─── PAGE 4: COMPANY ────────────────────────────────────────────────────────
async function renderCompany(
  doc: JsPdfDoc,
  product: Product,
  brochure: ReturnType<typeof normalizeBrochure>,
  coverImage: string | null
) {
  doc.addPage();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const s = safe(doc);
  const brand = brochure.brandName || "Tiger Rydo";
  const price = formatRs(getLowestPrice(product));

  doc.setFillColor(...BG);
  doc.rect(0, 0, pw, ph, "F");
  await drawBranding(doc, s);

  // Large logo centered
  const logo = await getLogo();
  if (logo) {
    await drawImg(doc, logo, { x: s.x + s.w / 2 - g(10), y: s.y + g(6), w: g(20), h: g(8) });
  }

  // Mission statement
  let y = s.y + g(18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text("OUR MISSION", s.x, y);
  y += g(2.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_SECONDARY);
  const mission = wrapText(doc, brochure.mission || "Build clean and premium electric mobility for everyday riders.", s.w, 3);
  doc.text(mission, s.x, y);

  // About
  y += g(6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...ACCENT);
  doc.text("ABOUT US", s.x, y);
  y += g(2.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT_SECONDARY);
  const aboutLines = wrapText(doc, brochure.companyDescription || "Electric two-wheeler brand focused on sustainability and rider comfort.", s.w, 6);
  doc.text(aboutLines, s.x, y);

  // Contact information — dark card
  y += g(10);
  const contactCardH = g(14);
  doc.setFillColor(...PANEL_DARK);
  doc.roundedRect(s.x, y, s.w, contactCardH, 3, 3, "F");

  let cy = y + g(2.5);
  const cx = s.x + g(3);
  const contactItems = [
    { label: "Website", value: brochure.website || "www.tigerrydo.com" },
    { label: "Email", value: brochure.email || "-" },
    { label: "Phone", value: brochure.phone || "-" },
    { label: "Address", value: brochure.address || "-" },
  ];
  contactItems.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...ACCENT);
    doc.text(item.label, cx, cy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 220);
    doc.text(clampLine(doc, item.value, s.w * 0.4), cx + g(10), cy);
    cy += g(2.8);
  });

  // QR code in dark card (right side)
  const qrSize = g(8);
  const qrX = s.x + s.w - g(3) - qrSize;
  const qrY = y + g(2);
  if (brochure.qrCodeUrl) {
    const qr = await fetchImage(brochure.qrCodeUrl);
    if (qr) await drawImg(doc, qr, { x: qrX, y: qrY, w: qrSize, h: qrSize });
  } else {
    doc.setDrawColor(80, 80, 80);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 2, 2, "S");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("QR", qrX + qrSize / 2, qrY + qrSize / 2, { align: "center" });
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(220, 220, 220);
  doc.text("SCAN & VISIT", qrX + qrSize / 2, qrY + qrSize + g(1), { align: "center" });

  // Small product render — bottom right
  const prodBlockY = y + contactCardH + g(3);
  if (coverImage) {
    const imgW = g(14);
    const imgH = g(10);
    const imgX = s.x + s.w - imgW;
    await drawImg(doc, coverImage, { x: imgX, y: prodBlockY, w: imgW, h: imgH });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text((product.name || "MODEL").toUpperCase(), imgX, prodBlockY + imgH + g(1.5));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...ACCENT);
    doc.text(price, imgX, prodBlockY + imgH + g(3.5));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(product.tagline || "Clean Energy Commuting", imgX, prodBlockY + imgH + g(5));
  }

  // Social links — bottom left
  const socials = brochure.socialLinks.length ? brochure.socialLinks.join("  ·  ") : "Instagram  ·  Facebook  ·  YouTube";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(socials, s.x, prodBlockY + g(6));

  // Footer
  const footerY = s.y + s.h;
  doc.setDrawColor(...DIVIDER);
  doc.setLineWidth(0.3);
  doc.line(s.x, footerY, s.x + s.w, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...TEXT_SECONDARY);
  doc.text(brand, s.x, footerY + 3);
  doc.text(brochure.website || "www.tigerrydo.com", s.x + s.w, footerY + 3, { align: "right" });
  doc.text(`\u00A9 ${new Date().getFullYear()} ${brand}. All rights reserved.`, s.x + s.w / 2, footerY + 3, { align: "center" });
}

// ─── Gallery Continuation Pages ─────────────────────────────────────────────
async function renderGalleryPages(doc: JsPdfDoc, gallery: GalleryItem[], startPage: number, brochure: ReturnType<typeof normalizeBrochure>) {
  if (gallery.length === 0) return;

  let remaining = gallery;
  let pageNo = startPage;

  while (remaining.length > 0) {
    doc.addPage();
    const s = safe(doc);
    doc.setFillColor(...BG);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
    await drawBranding(doc, s);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text("GALLERY", s.x, s.y + g(8));

    const cols = 3;
    const tileW = (s.w - g(2) * (cols - 1)) / cols;
    const tileH = g(10);
    const rowH = tileH + g(3);
    const startY = s.y + g(12);
    const maxRows = Math.floor((s.h - g(16)) / rowH);
    const maxItems = cols * maxRows;

    const batch = remaining.slice(0, maxItems);
    remaining = remaining.slice(maxItems);

    for (let i = 0; i < batch.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = s.x + col * (tileW + g(2));
      const ty = startY + row * rowH;

      doc.setFillColor(248, 248, 248);
      doc.roundedRect(tx, ty, tileW, tileH, 2, 2, "F");
      await drawImg(doc, batch[i].src, { x: tx + 1, y: ty + 1, w: tileW - 2, h: tileH - g(2) });

      if (batch[i].caption.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...TEXT_SECONDARY);
        doc.text(clampLine(doc, batch[i].caption, tileW - 4), tx + tileW / 2, ty + tileH - g(0.3), { align: "center" });
      }
    }

    const footerY = s.y + s.h;
    doc.setDrawColor(...DIVIDER);
    doc.line(s.x, footerY, s.x + s.w, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(brochure.brandName || "Tiger Rydo", s.x, footerY + 3);
    doc.text(brochure.website || "www.tigerrydo.com", s.x + s.w, footerY + 3, { align: "right" });
    pageNo++;
  }
}

// ─── Main Renderer ──────────────────────────────────────────────────────────
async function renderBrochurePageSet(doc: JsPdfDoc, product: Product) {
  const brochure = normalizeBrochure(product.brochure);
  const coverImage = product.imageUrl ? await fetchImage(product.imageUrl) : null;
  const gallery = (
    await Promise.all(brochure.galleryImages.map(async (g) => ({ src: await fetchImage(g.url), caption: g.caption })))
  )
    .filter((x): x is GalleryItem => Boolean(x.src))
    .map((x) => ({ src: x.src!, caption: x.caption || "" }));

  // Page 1: Cover
  await renderCover(doc, product, brochure, coverImage);

  // Page 2: Story
  const p2Gallery = gallery.slice(0, 3);
  await renderStory(doc, product, brochure, coverImage, p2Gallery);

  // Page 3: Specs (sync drawing, but need branding)
  doc.addPage();
  const s3 = safe(doc);
  doc.setFillColor(...BG);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
  await drawBranding(doc, s3);
  // Re-render specs content on current page (undo the extra addPage from renderSpecs)
  // Actually let's just inline specs here
  {
    const s = s3;
    let y = s.y + g(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(...TEXT_PRIMARY);
    doc.text("SPECIFICATIONS", s.x, y);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.8);
    doc.line(s.x, y + g(1), s.x + g(8), y + g(1));

    const cardW = (s.w - g(3)) / 2;
    const cardH = g(17);
    const cardStartY = y + g(4);

    const specSections = [
      { title: "POWERTRAIN", rows: [{ l: "Motor", v: brochure.motor }, { l: "Speed", v: brochure.speed }, { l: "Chassis", v: brochure.chassis }, { l: "Suspension", v: brochure.suspension }] },
      { title: "BATTERY & ELECTRICAL", rows: [{ l: "Battery", v: brochure.battery }, { l: "Charger", v: brochure.charger }, { l: "Charging (Lithium)", v: brochure.chargingTimeLithium }, { l: "Charging (Lead Acid)", v: brochure.chargingTimeLeadAcid }, { l: "Head Light", v: brochure.headLight }] },
      { title: "RIDE & COMFORT", rows: [{ l: "Brake System", v: brochure.brakeSystem }, { l: "Tyre", v: brochure.tyre }, { l: "Tyre Size", v: `${brochure.tyreSizeFront || ""} / ${brochure.tyreSizeRear || ""}`.replace(/^\s*\/\s*$/, "-") }, { l: "Weight", v: brochure.weight }] },
      { title: "SAFETY & FEATURES", rows: KEY_FEATURE_LABELS.map(({ key, label }) => ({ l: label, v: brochure.keyFeatures[key] ? "Yes" : "\u2014" })) },
    ];

    specSections.forEach((sec, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = s.x + col * (cardW + g(3));
      const cy = cardStartY + row * (cardH + g(3));
      doc.setFillColor(...BG);
      doc.setDrawColor(...DIVIDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(cx, cy, cardW, cardH, 3, 3, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...ACCENT);
      doc.text(sec.title, cx + g(2), cy + g(2.5));
      doc.setDrawColor(...DIVIDER);
      doc.setLineWidth(0.3);
      doc.line(cx + g(2), cy + g(3.5), cx + cardW - g(2), cy + g(3.5));
      let ry = cy + g(5.5);
      sec.rows.forEach((r) => {
        if (!r.v?.trim() || ry > cy + cardH - g(2)) return;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...TEXT_SECONDARY);
        doc.text(r.l, cx + g(2), ry);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...TEXT_PRIMARY);
        doc.text(clampLine(doc, r.v, cardW * 0.45), cx + cardW - g(2), ry, { align: "right" });
        ry += g(2.8);
      });
    });

    const iconY = cardStartY + cardH * 2 + g(3) * 2 + g(2);
    const iconItems = brochure.highlightFeatures.length >= 8
      ? brochure.highlightFeatures.slice(0, 8)
      : ["Efficient Batteries", "Digital Meter", "Bright Headlamp", "Hydraulic Suspension", "USB Charging", "Disc Brake", "Quick Charge", "Tubeless Tyre"];
    const iconCellW = s.w / 4;
    for (let i = 0; i < 8; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const ix = s.x + col * iconCellW + iconCellW / 2;
      const iy = iconY + row * g(7);
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(0.6);
      doc.circle(ix, iy + g(1.5), g(1.5), "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...TEXT_PRIMARY);
      doc.text(wrapText(doc, iconItems[i] || "", iconCellW - g(1.5), 2), ix, iy + g(4), { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...TEXT_SECONDARY);
      doc.text("Standard", ix, iy + g(5.5), { align: "center" });
    }

    const footerY = s.y + s.h;
    doc.setDrawColor(...DIVIDER);
    doc.line(s.x, footerY, s.x + s.w, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_SECONDARY);
    doc.text(brochure.brandName || "Tiger Rydo", s.x, footerY + 3);
    doc.text(brochure.website || "www.tigerrydo.com", s.x + s.w, footerY + 3, { align: "right" });
  }

  // Page 4: Company
  await renderCompany(doc, product, brochure, coverImage);

  // Gallery overflow pages (images beyond first 3 shown on page 2)
  const remainingGallery = gallery.slice(3);
  await renderGalleryPages(doc, remainingGallery, 5, brochure);
}

/** Download brochure PDF for a single e-bike, named after the bike title. */
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
