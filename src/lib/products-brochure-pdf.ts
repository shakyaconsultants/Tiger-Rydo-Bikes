import type { Product } from "@/lib/types";
import { KEY_FEATURE_LABELS, normalizeBrochure, speedCategoryLabel } from "@/lib/brochure";
import { getLowestPrice } from "@/lib/product-utils";

type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;

const ORANGE = { r: 255, g: 90, b: 0 } as const;
const BLACK = { r: 18, g: 18, b: 18 } as const;
const DARK = { r: 28, g: 28, b: 28 } as const;
const MUTED = { r: 110, g: 110, b: 110 } as const;
const LINE = { r: 230, g: 230, b: 230 } as const;
const LIGHT = { r: 248, g: 248, b: 248 } as const;

function rgb(c: { r: number; g: number; b: number }): [number, number, number] {
  return [c.r, c.g, c.b];
}

async function getBase64Image(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imageFormat(dataUrl: string): "PNG" | "JPEG" {
  return dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
}

function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

async function drawCoverImage(
  doc: JsPdfDoc,
  dataUrl: string,
  x: number,
  y: number,
  boxW: number,
  boxH: number
) {
  const { w, h } = await getImageSize(dataUrl);
  // "cover" behavior: fill the box and allow overflow crop by positioning.
  const scale = Math.max(boxW / w, boxH / h);
  const drawW = w * scale;
  const drawH = h * scale;
  const dx = x + (boxW - drawW) / 2;
  const dy = y + (boxH - drawH) / 2;
  doc.addImage(dataUrl, imageFormat(dataUrl), dx, dy, drawW, drawH);
}

function formatRs(price: number): string {
  return `Rs. ${new Intl.NumberFormat("en-IN").format(price)}`;
}

function slugifyFilename(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "brochure";
}

function drawPill(
  doc: JsPdfDoc,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  filled: boolean
) {
  doc.setDrawColor(...rgb(ORANGE));
  doc.setLineWidth(0.8);
  if (filled) {
    doc.setFillColor(...rgb(ORANGE));
    doc.roundedRect(x, y, w, h, h / 2, h / 2, "F");
    doc.setTextColor(255, 255, 255);
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, h / 2, h / 2, "S");
    doc.setTextColor(...rgb(ORANGE));
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(text, x + w / 2, y + h / 2 + 3, { align: "center" });
}

function drawSectionLabel(doc: JsPdfDoc, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...rgb(MUTED));
  doc.text(text.toUpperCase(), x, y);
  doc.setDrawColor(...rgb(ORANGE));
  doc.setLineWidth(0.5);
  doc.line(x, y + 2, x + Math.min(44, doc.getTextWidth(text.toUpperCase())), y + 2);
}

function drawBullet(doc: JsPdfDoc, label: string, x: number, y: number) {
  doc.setFillColor(...rgb(ORANGE));
  doc.circle(x, y - 1.2, 1.6, "F");
  doc.setTextColor(...rgb(BLACK));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(label, x + 4, y);
}

function drawIconYesNo(doc: JsPdfDoc, enabled: boolean, x: number, y: number) {
  const fill: [number, number, number] = enabled ? rgb(ORANGE) : [245, 245, 245];
  const text: [number, number, number] = enabled ? [255, 255, 255] : rgb(ORANGE);
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, 7.5, 7.5, 1.6, 1.6, "F");
  doc.setTextColor(...text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(enabled ? "✓" : "—", x + 3.75, y + 5.6, { align: "center" });
}

function drawFeatureCard(
  doc: JsPdfDoc,
  title: string,
  rows: { label: string; value: string }[],
  x: number,
  y: number,
  w: number,
  h: number
) {
  // shadow
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(x + 0.8, y + 0.8, w, h, 4, 4, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 4, 4, "F");
  doc.setDrawColor(...rgb(LINE));
  doc.roundedRect(x, y, w, h, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...rgb(BLACK));
  doc.text(title.toUpperCase(), x + 12, y + 10);
  doc.setDrawColor(...rgb(ORANGE));
  doc.setLineWidth(0.5);
  doc.line(x + 12, y + 14, x + 58, y + 14);

  let cursor = y + 26;
  rows.forEach((r) => {
    if (!r.value.trim()) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...rgb(MUTED));
    doc.text(r.label, x + 12, cursor);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...rgb(BLACK));
    const lines = doc.splitTextToSize(r.value, w - 24);
    doc.text(lines, x + 12, cursor + 6);
    cursor += 16 + Math.max(0, lines.length - 1) * 4;
  });
}

async function addBrochurePages(doc: JsPdfDoc, product: Product) {
  const brochure = normalizeBrochure(product.brochure);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageWidth - margin * 2;

  const coverImage = product.imageUrl ? await getBase64Image(product.imageUrl) : null;
  const galleryImages = (
    await Promise.all(brochure.galleryImageUrls.slice(0, 3).map((url) => getBase64Image(url)))
  ).filter((img): img is string => Boolean(img));

  const modelName = (product.name || "Model").toUpperCase();
  const speedLabel = speedCategoryLabel(brochure.speedCategory);
  const price = getLowestPrice(product);

  const shortStory =
    brochure.shortDescription.trim() ||
    `${product.name} brings clean, bold electric comfort to everyday city commutes.`;

  // =========================
  // PAGE 1 — HERO / COVER
  // =========================
  doc.setFillColor(...rgb(DARK));
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // subtle mesh
  doc.setFillColor(255, 90, 0);
  doc.circle(pageWidth * 0.18, pageHeight * 0.28, 55, "F");
  doc.setFillColor(70, 70, 70);
  doc.circle(pageWidth * 0.85, pageHeight * 0.18, 70, "F");
  doc.setFillColor(40, 40, 40);
  doc.circle(pageWidth * 0.65, pageHeight * 0.70, 120, "F");

  // top / bottom accent
  doc.setFillColor(...rgb(ORANGE));
  doc.rect(0, 0, pageWidth, 6, "F");
  doc.rect(0, pageHeight - 6, pageWidth, 6, "F");

  // header text hierarchy
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text((brochure.coverTagline || "CLEAN ENERGY COMMUTING").toUpperCase(), margin, 22);

  doc.setTextColor(...rgb(ORANGE));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(46);
  doc.text(modelName, margin, 66);

  // tagline
  doc.setTextColor(210, 210, 210);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12.5);
  const tagline = product.tagline || "Built for the City. Smart. Clean. Electric.";
  doc.text(tagline, margin, 86);

  // hero price + CTA
  const pillW = 62 + doc.getTextWidth(formatRs(price));
  drawPill(doc, "VIEW SPEC", margin, pageHeight - 26, 32, 10, false);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...rgb(ORANGE));
  doc.text(formatRs(price), margin, pageHeight - 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(190, 190, 190);
  doc.text(speedLabel.toUpperCase(), margin, pageHeight - 28);

  // hero image dominates: cover + bleed
  if (coverImage) {
    doc.setFillColor(0, 0, 0);
    doc.roundedRect(margin - 6, 98 + 1, contentW + 12, 110, 8, 8, "F");
    await drawCoverImage(doc, coverImage, margin - 10, 98, contentW + 22, 120);
  } else {
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(12);
    doc.text("Add product image to generate premium brochure.", margin, 140);
  }

  // =========================
  // PAGE 2 — STORY / LIFESTYLE
  // =========================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // soft background accents
  doc.setFillColor(255, 90, 0);
  doc.circle(pageWidth * 0.14, 36, 70, "F");
  doc.setFillColor(245, 245, 245);
  doc.circle(pageWidth * 0.82, 60, 100, "F");

  // Left story block
  drawSectionLabel(doc, "Why Royal", margin, 28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...rgb(BLACK));
  doc.setFontSize(34);
  doc.text(modelName, margin, 52);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12.5);
  doc.setTextColor(...rgb(MUTED));
  const storyLines = doc.splitTextToSize(shortStory, contentW * 0.44);
  doc.text(storyLines, margin, 70);

  let bxY = 122;
  const bullets = brochure.highlightFeatures.length
    ? brochure.highlightFeatures.slice(0, 3)
    : ["Efficient Batteries", "Quick Charge", "Hydraulic Suspension"];
  bullets.forEach((b) => {
    drawBullet(doc, b, margin, bxY);
    bxY += 10.5;
  });

  // Right: hero image on glass card (asymmetric)
  const imgX = margin + contentW * 0.52;
  const imgY = 62;
  const imgW = contentW * 0.46;
  const imgH = 140;

  // card shell
  // subtle elevation (shadow first, then card)
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(imgX + 1, imgY + 1, imgW, imgH, 10, 10, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(imgX, imgY, imgW, imgH, 10, 10, "F");
  doc.setDrawColor(...rgb(LINE));
  doc.roundedRect(imgX, imgY, imgW, imgH, 10, 10, "S");

  if (coverImage) {
    await drawCoverImage(doc, coverImage, imgX - 8, imgY - 6, imgW + 16, imgH + 10);
  }

  // Color chips
  const chipsY = 220;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...rgb(ORANGE));
  doc.text("Colors", margin, chipsY);

  let chipX = margin + 26;
  const chipBaseY = chipsY + 2;
  brochure.colors.slice(0, 6).forEach((c, idx) => {
    const label = c.toUpperCase();
    const w = Math.min(46 + doc.getTextWidth(label) / 1.6, 78);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...rgb(LINE));
    doc.roundedRect(chipX, chipBaseY + idx * 12, w, 10, 5, 5, "S");
    doc.setTextColor(...rgb(BLACK));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(label, chipX + w / 2, chipBaseY + idx * 12 + 3.5, { align: "center" });
  });

  // Highlights chips
  const hTitleY = pageHeight - 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...rgb(ORANGE));
  doc.text("Highlights", margin, hTitleY);
  let highlightChipX = margin;
  let highlightChipY = hTitleY + 10;
  const maxChipWidth = pageWidth - margin * 2;
  brochure.highlightFeatures.slice(0, 8).forEach((f) => {
    const txt = f.toUpperCase();
    const w = Math.min(34 + doc.getTextWidth(txt) / 2.0, 70);
    if (highlightChipX + w > margin + maxChipWidth) {
      highlightChipX = margin;
      highlightChipY += 10.5;
    }
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...rgb(ORANGE));
    doc.roundedRect(highlightChipX, highlightChipY, w, 8.5, 4, 4, "S");
    doc.setTextColor(...rgb(ORANGE));
    doc.setFontSize(7.8);
    doc.setFont("helvetica", "bold");
    doc.text(txt, highlightChipX + w / 2, highlightChipY + 6, { align: "center" });
    highlightChipX += w + 4;
  });

  // =========================
  // PAGE 3 — SPECIFICATIONS (premium cards)
  // =========================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(...rgb(BLACK));
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SPECIFICATIONS", margin, 20);
  doc.setFontSize(11);
  doc.setTextColor(...rgb(ORANGE));
  doc.text(modelName, pageWidth - margin, 20, { align: "right" });

  const gridGap = 10;
  const cardW = (contentW - gridGap) / 2;
  let cy = 40;
  drawFeatureCard(
    doc,
    "Powertrain",
    [
      { label: "Motor", value: brochure.motor },
      { label: "Speed", value: brochure.speed },
      { label: "Chassis", value: brochure.chassis },
      { label: "Other", value: brochure.otherFeature },
    ],
    margin,
    cy,
    cardW,
    82
  );
  drawFeatureCard(
    doc,
    "Ride & Comfort",
    [
      { label: "Suspension", value: brochure.suspension },
      { label: "Brake", value: brochure.brakeSystem },
      { label: "Tyre", value: brochure.tyre },
      {
        label: "Weight",
        value: brochure.weight,
      },
    ],
    margin + cardW + gridGap,
    cy,
    cardW,
    82
  );

  cy += 92;

  drawFeatureCard(
    doc,
    "Battery & Charge",
    [
      { label: "Battery", value: brochure.battery },
      { label: "Charger", value: brochure.charger },
      { label: "Lithium", value: brochure.chargingTimeLithium },
      { label: "Lead Acid", value: brochure.chargingTimeLeadAcid },
      { label: "Head Light", value: brochure.headLight },
    ],
    margin,
    cy,
    cardW,
    98
  );

  // Safety / features (as icon list)
  const rightX = margin + cardW + gridGap;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...rgb(LINE));
  doc.roundedRect(rightX, cy, cardW, 98, 10, 10, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...rgb(BLACK));
  doc.text("Safety & Features", rightX + 12, cy + 12);
  doc.setDrawColor(...rgb(ORANGE));
  doc.setLineWidth(0.5);
  doc.line(rightX + 12, cy + 16, rightX + 70, cy + 16);

  let fy = cy + 26;
  const featureRows = KEY_FEATURE_LABELS.map(({ key, label }) => ({
    label,
    enabled: Boolean(brochure.keyFeatures[key]),
  }));
  featureRows.forEach((fr) => {
    if (fy > cy + 88) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...rgb(MUTED));
    doc.text(fr.label, rightX + 12, fy + 4);
    drawIconYesNo(doc, fr.enabled, rightX + cardW - 22, fy + 1);
    fy += 10.5;
  });

  // Key Performance strip
  const stripY = cy + 108;
  doc.setFillColor(...rgb(ORANGE));
  doc.setDrawColor(...rgb(ORANGE));
  doc.roundedRect(margin, stripY, contentW, 18, 10, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const tyreSize = [
    brochure.tyreSizeFront && `Front ${brochure.tyreSizeFront}`,
    brochure.tyreSizeRear && `Rear ${brochure.tyreSizeRear}`,
  ]
    .filter(Boolean)
    .join(", ");

  const perfText = [
    `Tyre: ${brochure.tyre}`,
    tyreSize ? tyreSize : "",
    `Speedometer: ${brochure.speedometer}`,
  ]
    .filter(Boolean)
    .join("  •  ");
  doc.text(perfText, margin + 8, stripY + 12);

  // =========================
  // PAGE 4 — ABOUT / BRAND STORY
  // =========================
  doc.addPage();
  doc.setFillColor(...rgb(DARK));
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(...rgb(ORANGE));
  doc.rect(0, 0, pageWidth, 6, "F");
  doc.setFillColor(...rgb(ORANGE));
  doc.rect(0, pageHeight - 6, pageWidth, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...rgb(ORANGE));
  doc.text("SCAN & VISIT", margin, 36);

  doc.setFontSize(11.5);
  doc.setTextColor(230, 230, 230);
  doc.setFont("helvetica", "normal");
  const about =
    "An Indian manufacturer of electric two-wheelers, Tiger Rydo Bikes, founded with a mission to build a better, cleaner, and greener future. We engineer premium e-bikes for everyday comfort, performance, and reliability.";
  const aboutLines = doc.splitTextToSize(about, contentW * 0.72);
  doc.text(aboutLines, margin, 52);

  // Product summary card
  const cardX = margin;
  const cardY = 150;
  const cardH = 72;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardX, cardY, contentW * 0.62, cardH, 10, 10, "F");
  doc.setDrawColor(...rgb(LINE));
  doc.roundedRect(cardX, cardY, contentW * 0.62, cardH, 10, 10, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...rgb(BLACK));
  doc.text(modelName, cardX + 14, cardY + 18);
  doc.setFontSize(10.5);
  doc.setTextColor(...rgb(MUTED));
  doc.text((product.tagline || "Ride Bold. Ride Clean. Ride Future.").slice(0, 70), cardX + 14, cardY + 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...rgb(ORANGE));
  doc.text(formatRs(price), cardX + 14, cardY + 54);

  // Right: lifestyle image or gallery
  if (galleryImages[0]) {
    doc.setFillColor(0, 0, 0);
    doc.roundedRect(pageWidth - margin - 58, cardY + 6, 58, 58, 10, 10, "F");
    await drawCoverImage(
      doc,
      galleryImages[0],
      pageWidth - margin - 58,
      cardY + 8,
      58,
      58
    );
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text("Tiger Rydo", margin, pageHeight - 28);
  doc.text("www.tigerrydo.com", margin, pageHeight - 18);
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
  await addBrochurePages(doc, product);
  doc.save(`${slugifyFilename(product.name)}.pdf`);
}
