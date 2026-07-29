import type { Product } from "@/lib/types";
import { KEY_FEATURE_LABELS, normalizeBrochure, speedCategoryLabel } from "@/lib/brochure";
import { getLowestPrice } from "@/lib/product-utils";

type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;

const ORANGE: [number, number, number] = [255, 90, 0];
const BLACK: [number, number, number] = [18, 18, 18];
const DARK: [number, number, number] = [28, 28, 28];
const MUTED: [number, number, number] = [90, 90, 90];
const LINE: [number, number, number] = [230, 230, 230];
const LIGHT: [number, number, number] = [248, 248, 248];

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

async function drawContainedImage(
  doc: JsPdfDoc,
  dataUrl: string,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number
) {
  try {
    const { w, h } = await getImageSize(dataUrl);
    const scale = Math.min(boxW / w, boxH / h);
    const drawW = w * scale;
    const drawH = h * scale;
    const x = boxX + (boxW - drawW) / 2;
    const y = boxY + (boxH - drawH) / 2;
    doc.addImage(dataUrl, imageFormat(dataUrl), x, y, drawW, drawH);
  } catch {
    // ignore broken images
  }
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

function drawSpeedBadge(doc: JsPdfDoc, text: string, x: number, y: number) {
  const label = text.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const w = doc.getTextWidth(label) + 14;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.8);
  doc.roundedRect(x - w / 2, y - 5, w, 10, 2, 2, "S");
  doc.setTextColor(...ORANGE);
  doc.text(label, x, y + 1.5, { align: "center" });
}

function drawSectionTitle(doc: JsPdfDoc, title: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ORANGE);
  doc.text(title.toUpperCase(), x, y);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.6);
  doc.line(x, y + 2.5, x + Math.min(48, doc.getTextWidth(title.toUpperCase())), y + 2.5);
}

function drawSpecTable(
  doc: JsPdfDoc,
  rows: { label: string; value: string }[],
  x: number,
  y: number,
  width: number
): number {
  const usable = rows.filter((r) => r.value.trim());
  let cursor = y;
  usable.forEach((row, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(x, cursor, width, 9, "F");
    }
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(x, cursor + 9, x + width, cursor + 9);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(row.label, x + 3, cursor + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BLACK);
    const valueLines = doc.splitTextToSize(row.value, width * 0.55);
    doc.text(valueLines[0] || row.value, x + width * 0.42, cursor + 6);
    cursor += 9;
  });
  return cursor;
}

async function addBrochurePages(doc: JsPdfDoc, product: Product) {
  const brochure = normalizeBrochure(product.brochure);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageWidth - margin * 2;

  const coverImage = product.imageUrl ? await getBase64Image(product.imageUrl) : null;
  const galleryImages = (
    await Promise.all(brochure.galleryImageUrls.slice(0, 4).map((url) => getBase64Image(url)))
  ).filter((img): img is string => Boolean(img));

  const modelName = (product.name || "Model").toUpperCase();
  const speedLabel = speedCategoryLabel(brochure.speedCategory);
  const description =
    brochure.shortDescription.trim() ||
    product.description ||
    product.tagline ||
    `${product.name} is designed for clean, stylish, and comfortable city commuting.`;

  // =========================
  // PAGE 1 — COVER
  // =========================
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top orange accent bar
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageWidth, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text((brochure.coverTagline || "CLEAN ENERGY COMMUTING").toUpperCase(), pageWidth / 2, 28, {
    align: "center",
  });

  doc.setFontSize(42);
  doc.setTextColor(...ORANGE);
  doc.text(modelName, pageWidth / 2, 52, { align: "center" });

  drawSpeedBadge(doc, speedLabel, pageWidth / 2 - 45, 66);
  drawSpeedBadge(doc, speedLabel, pageWidth / 2 + 45, 66);

  // Hero image panel
  doc.setFillColor(38, 38, 38);
  doc.roundedRect(margin, 84, contentW, 170, 4, 4, "F");
  if (coverImage) {
    await drawContainedImage(doc, coverImage, margin + 8, 92, contentW - 16, 154);
  } else {
    doc.setTextColor(120);
    doc.setFontSize(12);
    doc.text("Product image", pageWidth / 2, 170, { align: "center" });
  }

  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(product.tagline || "Built for the City. Smart. Clean. Electric.", pageWidth / 2, 272, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ORANGE);
  doc.text(formatRs(getLowestPrice(product)), pageWidth / 2, 288, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Tiger Rydo", pageWidth / 2, pageHeight - 18, { align: "center" });

  // Bottom orange accent
  doc.setFillColor(...ORANGE);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  // =========================
  // PAGE 2 — OVERVIEW
  // =========================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageWidth, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...BLACK);
  doc.text(modelName, margin, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...MUTED);
  const descLines = doc.splitTextToSize(description, contentW);
  doc.text(descLines.slice(0, 6), margin, 42);
  let y = 42 + Math.min(descLines.length, 6) * 5.2 + 10;

  if (brochure.colors.length > 0) {
    drawSectionTitle(doc, "Colors Available", margin, y);
    y += 10;
    let colorX = margin;
    brochure.colors.forEach((color) => {
      const chipW = Math.max(28, doc.getTextWidth(color) + 12);
      if (colorX + chipW > pageWidth - margin) {
        colorX = margin;
        y += 12;
      }
      doc.setFillColor(...LIGHT);
      doc.setDrawColor(...LINE);
      doc.roundedRect(colorX, y - 5, chipW, 9, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...BLACK);
      doc.text(color.toUpperCase(), colorX + chipW / 2, y + 1, { align: "center" });
      colorX += chipW + 5;
    });
    y += 16;
  }

  // Main + gallery visuals
  const mainImgH = 95;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(margin, y, contentW, mainImgH, 3, 3, "F");
  if (coverImage) {
    await drawContainedImage(doc, coverImage, margin + 6, y + 4, contentW - 12, mainImgH - 8);
  }
  y += mainImgH + 8;

  if (galleryImages.length > 0) {
    const gap = 5;
    const cols = Math.min(galleryImages.length, 3);
    const tileW = (contentW - gap * (cols - 1)) / cols;
    const tileH = 48;
    for (let i = 0; i < cols; i++) {
      const x = margin + i * (tileW + gap);
      doc.setFillColor(...LIGHT);
      doc.roundedRect(x, y, tileW, tileH, 2, 2, "F");
      await drawContainedImage(doc, galleryImages[i], x + 3, y + 3, tileW - 6, tileH - 6);
    }
  }

  doc.setFillColor(...ORANGE);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  // =========================
  // PAGE 3 — SPECIFICATION
  // =========================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Dark header band
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, pageWidth, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SPECIFICATION", margin, 21);
  doc.setFontSize(9);
  doc.setTextColor(...ORANGE);
  doc.text(modelName, pageWidth - margin, 21, { align: "right" });

  y = 46;

  if (brochure.colors.length > 0) {
    drawSectionTitle(doc, "Colors Available", margin, y);
    y += 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text(brochure.colors.map((c) => c.toUpperCase()).join("   ·   "), margin, y);
    y += 12;
  }

  const leftW = contentW * 0.48;
  const rightW = contentW * 0.48;
  const rightX = margin + contentW * 0.52;

  drawSectionTitle(doc, "Motor / Speed / Chassis", margin, y);
  drawSectionTitle(doc, "Brake / Tyre / Weight", rightX, y);
  y += 8;

  const motorRows = [
    { label: "Motor", value: brochure.motor },
    { label: "Speed", value: brochure.speed },
    { label: "Chassis", value: brochure.chassis },
    { label: "Suspension", value: brochure.suspension },
    { label: "Other", value: brochure.otherFeature },
  ];
  const brakeRows = [
    { label: "Brake", value: brochure.brakeSystem },
    { label: "Tyre", value: brochure.tyre },
    {
      label: "Tyre Size",
      value: [
        brochure.tyreSizeFront && `Front ${brochure.tyreSizeFront}`,
        brochure.tyreSizeRear && `Rear ${brochure.tyreSizeRear}`,
      ]
        .filter(Boolean)
        .join(", "),
    },
    { label: "Weight", value: brochure.weight },
    { label: "Speedometer", value: brochure.speedometer },
  ];

  const leftEnd = drawSpecTable(doc, motorRows, margin, y, leftW);
  const rightEnd = drawSpecTable(doc, brakeRows, rightX, y, rightW);
  y = Math.max(leftEnd, rightEnd) + 12;

  drawSectionTitle(doc, "Key Features", margin, y);
  y += 8;

  const featureCols = 2;
  const featureW = (contentW - 6) / featureCols;
  KEY_FEATURE_LABELS.forEach(({ key, label }, index) => {
    const col = index % featureCols;
    const row = Math.floor(index / featureCols);
    const x = margin + col * (featureW + 6);
    const fy = y + row * 11;
    const on = brochure.keyFeatures[key];

    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, fy, featureW, 9, 1.5, 1.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BLACK);
    doc.text(label, x + 3, fy + 6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(on ? ORANGE[0] : 150, on ? ORANGE[1] : 150, on ? ORANGE[2] : 150);
    doc.text(on ? "Yes" : "No", x + featureW - 3, fy + 6, { align: "right" });
  });
  y += Math.ceil(KEY_FEATURE_LABELS.length / featureCols) * 11 + 10;

  drawSectionTitle(doc, "Battery & Lighting", margin, y);
  y += 8;
  const batteryEnd = drawSpecTable(
    doc,
    [
      { label: "Battery", value: brochure.battery },
      { label: "Charger", value: brochure.charger },
      { label: "Lithium Charge", value: brochure.chargingTimeLithium },
      { label: "Lead Acid Charge", value: brochure.chargingTimeLeadAcid },
      { label: "Head Light", value: brochure.headLight },
    ],
    margin,
    y,
    contentW
  );
  y = batteryEnd + 12;

  if (brochure.highlightFeatures.length > 0) {
    drawSectionTitle(doc, "Highlights", margin, y);
    y += 9;
    const cols = 4;
    const gap = 5;
    const boxW = (contentW - gap * (cols - 1)) / cols;
    brochure.highlightFeatures.slice(0, 8).forEach((feature, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = margin + col * (boxW + gap);
      const by = y + row * 28;

      doc.setFillColor(...BLACK);
      doc.roundedRect(x, by, boxW, 24, 2, 2, "F");
      doc.setFillColor(...ORANGE);
      doc.circle(x + boxW / 2, by + 7, 2.2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      const lines = doc.splitTextToSize(feature, boxW - 6);
      doc.text(lines.slice(0, 2), x + boxW / 2, by + 14, { align: "center" });
    });
  }

  doc.setFillColor(...ORANGE);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");

  // =========================
  // PAGE 4 — ABOUT
  // =========================
  doc.addPage();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageWidth, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...ORANGE);
  doc.text("ABOUT US", margin, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(220, 220, 220);
  const about = doc.splitTextToSize(
    "Tiger Rydo is building clean, bold electric mobility for modern cities. Our mission is a better, cleaner and greener future — stylish e-bikes designed for everyday comfort, performance, and reliability.",
    contentW
  );
  doc.text(about, margin, 56);

  y = 56 + about.length * 6 + 18;
  doc.setFillColor(38, 38, 38);
  doc.roundedRect(margin, y, contentW, 70, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ORANGE);
  doc.text(modelName, margin + 10, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(210, 210, 210);
  doc.text(product.tagline || "Ride Bold. Ride Clean. Ride Future.", margin + 10, y + 28);
  doc.text(`Starting at ${formatRs(getLowestPrice(product))}`, margin + 10, y + 42);
  doc.text(`Category: ${speedLabel}`, margin + 10, y + 54);

  if (coverImage) {
    await drawContainedImage(doc, coverImage, pageWidth - margin - 70, y + 8, 58, 54);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Tiger Rydo", margin, pageHeight - 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text("www.tigerrydo.com", margin, pageHeight - 26);
  doc.text("Clean Energy Commuting", margin, pageHeight - 16);

  doc.setFillColor(...ORANGE);
  doc.rect(0, pageHeight - 4, pageWidth, 4, "F");
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
