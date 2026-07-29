import type { Product } from "@/lib/types";
import { KEY_FEATURE_LABELS, normalizeBrochure, speedCategoryLabel } from "@/lib/brochure";
import { formatPrice, getLowestPrice } from "@/lib/product-utils";

type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;

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

function drawFooter(doc: JsPdfDoc, pageWidth: number, pageHeight: number) {
  doc.setDrawColor(220);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Tiger Rydo", 14, pageHeight - 10);
  doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 14, pageHeight - 10, {
    align: "right",
  });
}

function drawSpecRow(
  doc: JsPdfDoc,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth = 42,
  valueWidth = 48
) {
  if (!value.trim()) return y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40);
  const lines = doc.splitTextToSize(value, valueWidth);
  doc.text(lines, x + labelWidth, y);
  return y + Math.max(6, lines.length * 4.5);
}

async function addBrochurePages(doc: JsPdfDoc, product: Product) {
  const brochure = normalizeBrochure(product.brochure);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const coverImage = product.imageUrl ? await getBase64Image(product.imageUrl) : null;
  const gallery = (
    await Promise.all(
      brochure.galleryImageUrls.slice(0, 3).map(async (url) => ({
        url,
        data: await getBase64Image(url),
      }))
    )
  ).filter((item) => item.data);

  // Cover
  doc.setFillColor(255, 90, 0);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text((brochure.coverTagline || "CLEAN ENERGY COMMUTING").toUpperCase(), pageWidth / 2, 28, {
    align: "center",
  });
  doc.setFontSize(36);
  doc.text(product.name.toUpperCase() || "MODEL", pageWidth / 2, 52, { align: "center" });

  const speedLabel = speedCategoryLabel(brochure.speedCategory).toUpperCase();
  doc.setFillColor(20, 20, 20);
  doc.roundedRect(pageWidth / 2 - 28, 62, 56, 10, 2, 2, "F");
  doc.setFontSize(9);
  doc.text(speedLabel, pageWidth / 2, 69, { align: "center" });

  if (coverImage) {
    try {
      doc.addImage(coverImage, imageFormat(coverImage), 28, 90, pageWidth - 56, 110);
    } catch {
      // ignore
    }
  }

  doc.setFontSize(11);
  doc.text(formatPrice(getLowestPrice(product)), pageWidth / 2, pageHeight - 28, {
    align: "center",
  });
  doc.setFontSize(9);
  doc.text("Tiger Rydo E-Bike Brochure", pageWidth / 2, pageHeight - 18, { align: "center" });

  // Overview
  doc.addPage();
  doc.setFillColor(255, 90, 0);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(product.name.toUpperCase(), 14, 18);

  let y = 42;
  doc.setTextColor(40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const description =
    brochure.shortDescription.trim() ||
    product.description ||
    product.tagline ||
    `${product.name} is designed for clean, stylish, and comfortable city commuting.`;
  const descLines = doc.splitTextToSize(description, pageWidth - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 6 + 8;

  if (brochure.colors.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 90, 0);
    doc.text("COLORS AVAILABLE", 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40);
    brochure.colors.forEach((color) => {
      doc.circle(18, y - 1.5, 2, "F");
      doc.text(color, 24, y);
      y += 7;
    });
    y += 4;
  }

  if (gallery.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 90, 0);
    doc.text("GALLERY", 14, y);
    y += 6;
    const imgW = (pageWidth - 28 - 8) / Math.min(gallery.length, 3);
    gallery.forEach((item, index) => {
      if (!item.data) return;
      try {
        doc.addImage(item.data, imageFormat(item.data), 14 + index * (imgW + 4), y, imgW, 42);
      } catch {
        // ignore
      }
    });
  }

  drawFooter(doc, pageWidth, pageHeight);

  // Specs
  doc.addPage();
  doc.setFillColor(255, 90, 0);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SPECIFICATION", 14, 18);

  y = 40;
  doc.setTextColor(255, 90, 0);
  doc.setFontSize(11);
  doc.text("Electrical Motor / Speed / Chassis", 14, y);
  y += 8;

  const leftX = 14;
  const rightX = pageWidth / 2 + 4;
  let leftY = y;
  let rightY = y;

  leftY = drawSpecRow(doc, "Motor", brochure.motor, leftX, leftY);
  leftY = drawSpecRow(doc, "Speed", brochure.speed, leftX, leftY);
  leftY = drawSpecRow(doc, "Chassis", brochure.chassis, leftX, leftY);
  rightY = drawSpecRow(doc, "Suspension", brochure.suspension, rightX, rightY);
  rightY = drawSpecRow(doc, "Other", brochure.otherFeature, rightX, rightY, 28, 58);

  y = Math.max(leftY, rightY) + 8;
  doc.setTextColor(255, 90, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Key Features", 14, y);
  y += 6;

  KEY_FEATURE_LABELS.forEach(({ key, label }) => {
    const enabled = brochure.keyFeatures[key];
    doc.setFillColor(enabled ? 230 : 245, enabled ? 245 : 245, enabled ? 230 : 245);
    doc.roundedRect(14, y - 4, pageWidth - 28, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40);
    doc.text(label, 18, y + 1);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(enabled ? 16 : 140, enabled ? 140 : 140, enabled ? 60 : 140);
    doc.text(enabled ? "Yes" : "No", pageWidth - 18, y + 1, { align: "right" });
    y += 10;
  });

  y += 4;
  doc.setTextColor(255, 90, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Brake / Tyre / Weight", 14, y);
  y += 8;

  leftY = y;
  rightY = y;
  leftY = drawSpecRow(doc, "Brake", brochure.brakeSystem, leftX, leftY);
  leftY = drawSpecRow(doc, "Tyre", brochure.tyre, leftX, leftY);
  leftY = drawSpecRow(
    doc,
    "Tyre Size",
    [
      brochure.tyreSizeFront && `Front ${brochure.tyreSizeFront}`,
      brochure.tyreSizeRear && `Rear ${brochure.tyreSizeRear}`,
    ]
      .filter(Boolean)
      .join(", "),
    leftX,
    leftY
  );
  rightY = drawSpecRow(doc, "Weight", brochure.weight, rightX, rightY);
  rightY = drawSpecRow(doc, "Speedo", brochure.speedometer, rightX, rightY);

  y = Math.max(leftY, rightY) + 8;
  doc.setTextColor(255, 90, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Battery & Lighting", 14, y);
  y += 8;

  leftY = y;
  rightY = y;
  leftY = drawSpecRow(doc, "Battery", brochure.battery, leftX, leftY);
  leftY = drawSpecRow(doc, "Charger", brochure.charger, leftX, leftY);
  rightY = drawSpecRow(doc, "Lithium", brochure.chargingTimeLithium, rightX, rightY);
  rightY = drawSpecRow(doc, "Lead Acid", brochure.chargingTimeLeadAcid, rightX, rightY);
  rightY = drawSpecRow(doc, "Head Light", brochure.headLight, rightX, rightY);

  y = Math.max(leftY, rightY) + 10;

  if (brochure.highlightFeatures.length > 0) {
    doc.setTextColor(255, 90, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Highlights", 14, y);
    y += 6;

    const chipWidth = (pageWidth - 28 - 12) / 4;
    brochure.highlightFeatures.slice(0, 8).forEach((feature, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = 14 + col * (chipWidth + 4);
      const chipY = y + row * 16;
      doc.setFillColor(255, 240, 230);
      doc.roundedRect(x, chipY, chipWidth, 12, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(255, 90, 0);
      const lines = doc.splitTextToSize(feature, chipWidth - 4);
      doc.text(lines[0] || feature, x + chipWidth / 2, chipY + 7, { align: "center" });
    });
  }

  drawFooter(doc, pageWidth, pageHeight);
}

export async function downloadProductsBrochurePdf(products: Product[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  const brochureProducts = products.filter((p) => normalizeBrochure(p.brochure).enabled);

  if (brochureProducts.length === 0) {
    throw new Error("No e-bikes have brochure enabled. Turn on brochure for at least one product.");
  }

  for (let i = 0; i < brochureProducts.length; i++) {
    if (i > 0) doc.addPage();
    await addBrochurePages(doc, brochureProducts[i]);
  }

  doc.save("tiger-rydo-ebike-brochure.pdf");
}
