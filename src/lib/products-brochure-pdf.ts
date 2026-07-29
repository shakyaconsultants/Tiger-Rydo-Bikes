import type { Product } from "@/lib/types";
import { KEY_FEATURE_LABELS, normalizeBrochure, speedCategoryLabel } from "@/lib/brochure";
import { getLowestPrice } from "@/lib/product-utils";

type JsPdfDoc = InstanceType<typeof import("jspdf").jsPDF>;

type Rect = { x: number; y: number; w: number; h: number };
type GalleryItem = { src: string; caption: string };

const SAFE_MARGIN_MM = 18;
const GUTTER_MM = 4;
const BASE_SPACE = 2.82; // ~8 px in mm
const ORANGE = [255, 90, 0] as const;
const BLACK = [18, 18, 18] as const;
const WHITE = [255, 255, 255] as const;
const LINE = [226, 226, 226] as const;
const MUTED = [105, 105, 105] as const;
const SOFT_PAPER = [250, 248, 244] as const;
const PANEL = [23, 19, 15] as const;

function sp(step: number): number {
  return BASE_SPACE * step;
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

function clampOneLineWithEllipsis(doc: JsPdfDoc, text: string, width: number): string {
  const raw = text.trim();
  if (!raw) return "";
  if (doc.getTextWidth(raw) <= width) return raw;
  let out = raw;
  while (out.length > 1 && doc.getTextWidth(`${out}...`) > width) {
    out = out.slice(0, -1);
  }
  return `${out}...`;
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

function intersects(a: Rect, b: Rect): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function safeArea(doc: JsPdfDoc): Rect {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  return { x: SAFE_MARGIN_MM, y: SAFE_MARGIN_MM, w: w - SAFE_MARGIN_MM * 2, h: h - SAFE_MARGIN_MM * 2 };
}

function assertInside(bounds: Rect, safe: Rect, name: string) {
  const over =
    bounds.x < safe.x ||
    bounds.y < safe.y ||
    bounds.x + bounds.w > safe.x + safe.w ||
    bounds.y + bounds.h > safe.y + safe.h;
  if (over) throw new Error(`Layout overflow detected: ${name}`);
}

function clampRect(rect: Rect, safe: Rect): Rect {
  const w = Math.min(rect.w, safe.w);
  const h = Math.min(rect.h, safe.h);
  return {
    x: Math.min(Math.max(rect.x, safe.x), safe.x + safe.w - w),
    y: Math.min(Math.max(rect.y, safe.y), safe.y + safe.h - h),
    w,
    h,
  };
}

function makeGrid(doc: JsPdfDoc, columns = 12) {
  const safe = safeArea(doc);
  const totalGutters = GUTTER_MM * (columns - 1);
  const colW = (safe.w - totalGutters) / columns;
  const colRect = (start: number, span: number, y: number, h: number): Rect => ({
    x: safe.x + (start - 1) * (colW + GUTTER_MM),
    y,
    w: colW * span + GUTTER_MM * (span - 1),
    h,
  });
  return { safe, colRect, colW };
}

function wrapLines(doc: JsPdfDoc, text: string, width: number, maxLines?: number): string[] {
  const lines = doc.splitTextToSize(text, width) as string[];
  return maxLines ? lines.slice(0, maxLines) : lines;
}

async function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

async function drawContainImage(doc: JsPdfDoc, dataUrl: string, rect: Rect, fill = false) {
  const { w, h } = await getImageSize(dataUrl);
  const scale = fill ? Math.max(rect.w / w, rect.h / h) : Math.min(rect.w / w, rect.h / h);
  const drawW = w * scale;
  const drawH = h * scale;
  const x = rect.x + (rect.w - drawW) / 2;
  const y = rect.y + (rect.h - drawH) / 2;
  doc.addImage(dataUrl, imageFormat(dataUrl), x, y, drawW, drawH);
}

function drawBranding(doc: JsPdfDoc, brandName: string, logoUrl: string, safe: Rect, pageNo: number) {
  void logoUrl;
  // topbar (gradient-like two-tone)
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW * 0.55, sp(0.9), "F");
  doc.setFillColor(185, 53, 10);
  doc.rect(pageW * 0.55, 0, pageW * 0.45, sp(0.9), "F");

  // logo stripes
  const stripeX = safe.x;
  const stripeBaseY = safe.y - sp(0.9);
  const stripeW = 1.1;
  const stripeGap = 0.9;
  [4.2, 2.8, 1.7].forEach((h, idx) => {
    doc.setFillColor(...ORANGE);
    doc.roundedRect(stripeX + idx * (stripeW + stripeGap), stripeBaseY - h, stripeW, h, 0.3, 0.3, "F");
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BLACK);
  doc.text("TIGER", stripeX + 6.8, safe.y - sp(0.9));
  doc.setTextColor(...ORANGE);
  doc.text("RYDO", stripeX + 6.8, safe.y + sp(0.65));

  // page badge
  const badgeText = `PAGE ${String(pageNo).padStart(2, "0")}`;
  const badgeW = Math.max(22, doc.getTextWidth(badgeText) + 10);
  const badgeH = 7;
  const badgeX = safe.x + safe.w - badgeW;
  const badgeY = safe.y - 6.8;
  doc.setDrawColor(...LINE);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3.5, 3.5, "S");
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(badgeText, badgeX + badgeW / 2, badgeY + 4.8, { align: "center" });

  // thin brand fallback mark on right if no image logo
  if (!brandName?.trim()) return;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
}

function drawFooter(doc: JsPdfDoc, safe: Rect, brandName: string, website: string) {
  const y = safe.y + safe.h + sp(0.6);
  doc.setDrawColor(...LINE);
  doc.line(safe.x, y, safe.x + safe.w, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(brandName || "Tiger Rydo", safe.x, y + 3.4);
  doc.text(website || "www.tigerrydo.com", safe.x + safe.w, y + 3.4, { align: "right" });
}

function validateLayout(
  safe: Rect,
  boxes: Array<{ name: string; rect: Rect }>,
  allowedOverlaps: Array<[string, string]> = []
) {
  boxes.forEach((b) => assertInside(b.rect, safe, b.name));
  // Intentionally allow visual overlap inside safe area (hero bleed, layered cards, etc.).
  // Keep `allowedOverlaps` param for API compatibility with existing call sites.
  void allowedOverlaps;
}

function planGallery(rect: Rect, images: GalleryItem[]): { placed: Array<GalleryItem & { rect: Rect }>; remaining: GalleryItem[] } {
  const tileH = sp(5.5);
  const capH = sp(1.6);
  const rowH = tileH + capH + sp(1);
  const cols = 3;
  const tileW = (rect.w - GUTTER_MM * (cols - 1)) / cols;
  const maxRows = Math.max(1, Math.floor(rect.h / rowH));
  const maxItems = cols * maxRows;
  const subset = images.slice(0, maxItems);
  const placed = subset.map((item, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    return {
      ...item,
      rect: {
        x: rect.x + col * (tileW + GUTTER_MM),
        y: rect.y + row * rowH,
        w: tileW,
        h: tileH,
      },
    };
  });
  return { placed, remaining: images.slice(maxItems) };
}

async function renderLogoIfAvailable(doc: JsPdfDoc, logoUrl: string, safe: Rect) {
  if (!logoUrl) return;
  const base64 = await getBase64Image(logoUrl);
  if (!base64) return;
  const logoRect: Rect = { x: safe.x + safe.w - 24, y: safe.y - 8, w: 24, h: 6 };
  await drawContainImage(doc, base64, logoRect, false);
}

async function renderBrochurePageSet(doc: JsPdfDoc, product: Product) {
  const brochure = normalizeBrochure(product.brochure);
  const grid = makeGrid(doc, 12);
  const safe = grid.safe;
  const brand = brochure.brandName || "Tiger Rydo";
  const speed = speedCategoryLabel(brochure.speedCategory).toUpperCase();
  const price = formatRs(getLowestPrice(product));

  const coverImage = product.imageUrl ? await getBase64Image(product.imageUrl) : null;
  const gallerySources = (
    await Promise.all(
      brochure.galleryImages.map(async (g) => ({ src: await getBase64Image(g.url), caption: g.caption }))
    )
  )
    .filter((x): x is GalleryItem => Boolean(x.src))
    .map((x) => ({ src: x.src!, caption: x.caption || "" }));

  // PAGE 1 HERO (HTML parity)
  drawBranding(doc, brand, brochure.logoUrl, safe, 1);
  await renderLogoIfAvailable(doc, brochure.logoUrl, safe);
  doc.setFillColor(...SOFT_PAPER);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");

  const titleRect = clampRect(grid.colRect(1, 6, safe.y + sp(2.2), sp(11)), safe);
  const priceRect = clampRect(grid.colRect(1, 4, safe.y + safe.h - sp(5.3), sp(4)), safe);
  const heroRect = clampRect(grid.colRect(1, 12, safe.y + sp(13), safe.h - sp(20)), safe);
  const layoutBoxes = [
    { name: "p1.title", rect: titleRect },
    { name: "p1.price", rect: priceRect },
    { name: "p1.hero", rect: heroRect },
  ];
  validateLayout(safe, layoutBoxes, [
    ["p1.title", "p1.hero"],
    ["p1.price", "p1.hero"],
  ]);

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text((brochure.coverTagline || "CLEAN ENERGY COMMUTING").toUpperCase(), titleRect.x, titleRect.y + sp(1.4));
  doc.setTextColor(...ORANGE);
  doc.setFontSize(44);
  const modelParts = (product.name || "MODEL").toUpperCase().split(" ");
  if (modelParts.length > 1) {
    doc.setTextColor(...BLACK);
    doc.text(modelParts.slice(0, -1).join(" "), titleRect.x, titleRect.y + sp(5.2));
    doc.setTextColor(...ORANGE);
    doc.text(modelParts[modelParts.length - 1], titleRect.x, titleRect.y + sp(8.2));
  } else {
    doc.setTextColor(...BLACK);
    doc.text(modelParts[0], titleRect.x, titleRect.y + sp(6.2));
  }
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(11);
  const tagline = wrapLines(doc, product.tagline || "Built for the City. Smart. Clean. Electric.", titleRect.w * 0.9, 2);
  doc.text(tagline, titleRect.x, titleRect.y + sp(10.4));

  doc.setFillColor(...PANEL);
  doc.roundedRect(titleRect.x, titleRect.y + sp(12.8), 36, 8, 4, 4, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`${speed} EV`, titleRect.x + 18, titleRect.y + sp(15.2), { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("ON-ROAD PRICE", priceRect.x, priceRect.y + sp(0.9));
  doc.setFontSize(24);
  doc.setTextColor(185, 53, 10);
  doc.text(price, priceRect.x, priceRect.y + sp(3.6));

  if (coverImage) {
    doc.setFillColor(...PANEL);
    doc.roundedRect(heroRect.x, heroRect.y, heroRect.w, heroRect.h, 6, 6, "F");
    await drawContainImage(doc, coverImage, {
      x: heroRect.x + 1,
      y: heroRect.y + 1,
      w: heroRect.w - 2,
      h: heroRect.h - 2,
    }, true);
  }
  drawFooter(doc, safe, brand, brochure.website);

  // PAGE 2 STORY + HIGHLIGHTS
  doc.addPage();
  const safe2 = safeArea(doc);
  drawBranding(doc, brand, brochure.logoUrl, safe2, 2);
  await renderLogoIfAvailable(doc, brochure.logoUrl, safe2);
  const storyRect = grid.colRect(1, 7, safe2.y + sp(3.6), sp(13));
  const imageRect = grid.colRect(8, 5, safe2.y + sp(3.6), sp(13));
  const highlightsRect = grid.colRect(1, 12, safe2.y + sp(17.8), sp(9.4));
  const galleryRect = grid.colRect(1, 12, safe2.y + sp(27.4), safe2.h - sp(29.2));
  validateLayout(safe2, [
    { name: "p2.story", rect: storyRect },
    { name: "p2.image", rect: imageRect },
    { name: "p2.highlights", rect: highlightsRect },
    { name: "p2.gallery", rect: galleryRect },
  ]);

  doc.setTextColor(...BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text((product.name || "MODEL").toUpperCase(), storyRect.x, storyRect.y + sp(2.4));
  doc.setFontSize(10.5);
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  const story = wrapLines(
    doc,
    brochure.shortDescription || product.description || `${product.name} is built for clean urban mobility.`,
    storyRect.w,
    7
  );
  doc.text(story, storyRect.x, storyRect.y + sp(5));

  if (coverImage) {
    doc.setFillColor(...PANEL);
    doc.roundedRect(imageRect.x, imageRect.y, imageRect.w, imageRect.h, 6, 6, "F");
    await drawContainImage(doc, coverImage, {
      x: imageRect.x + 2,
      y: imageRect.y + 2,
      w: imageRect.w - 4,
      h: imageRect.h - 4,
    }, true);
  }

  // 3 premium highlight cards
  const highlightItems = brochure.highlightFeatures.length
    ? brochure.highlightFeatures.slice(0, 3)
    : ["Efficient Batteries", "Quick Charge", "Hydraulic Suspension"];
  const hw = (highlightsRect.w - GUTTER_MM * 2) / 3;
  highlightItems.forEach((h, idx) => {
    const hx = highlightsRect.x + idx * (hw + GUTTER_MM);
    const hy = highlightsRect.y;
    doc.setFillColor(...WHITE);
    doc.roundedRect(hx, hy, hw, highlightsRect.h, 3, 3, "F");
    doc.setDrawColor(...LINE);
    doc.roundedRect(hx, hy, hw, highlightsRect.h, 3, 3, "S");
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.7);
    doc.circle(hx + sp(2.2), hy + sp(2.1), sp(1.05), "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...BLACK);
    doc.text(clampOneLineWithEllipsis(doc, h, hw - sp(4)), hx + sp(0.9), hy + sp(4.4));
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Premium feature detail", hx + sp(0.9), hy + sp(6.2));
  });

  const g1 = planGallery(galleryRect, gallerySources);
  for (const tile of g1.placed) {
    doc.setFillColor(...WHITE);
    doc.roundedRect(tile.rect.x, tile.rect.y, tile.rect.w, tile.rect.h + sp(1.8), 2, 2, "F");
    doc.setDrawColor(...LINE);
    doc.roundedRect(tile.rect.x, tile.rect.y, tile.rect.w, tile.rect.h + sp(1.8), 2, 2, "S");
    await drawContainImage(doc, tile.src, {
      x: tile.rect.x + 1,
      y: tile.rect.y + 1,
      w: tile.rect.w - 2,
      h: tile.rect.h - 2,
    });
    if (tile.caption.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      const cap = clampOneLineWithEllipsis(doc, tile.caption, tile.rect.w - 2);
      doc.text(cap, tile.rect.x + tile.rect.w / 2, tile.rect.y + tile.rect.h + sp(1.3), { align: "center" });
    }
  }
  drawFooter(doc, safe2, brand, brochure.website);

  // Optional continuation page for remaining gallery items
  let remaining = g1.remaining;
  let pageNo = 3;
  while (remaining.length > 0) {
    doc.addPage();
    const s = safeArea(doc);
    drawBranding(doc, brand, brochure.logoUrl, s, pageNo);
    await renderLogoIfAvailable(doc, brochure.logoUrl, s);
    const contRect = grid.colRect(1, 12, s.y + sp(3), s.h - sp(8));
    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("GALLERY", contRect.x, contRect.y - sp(0.8));

    const g = planGallery(contRect, remaining);
    for (const tile of g.placed) {
      doc.setFillColor(...WHITE);
      doc.roundedRect(tile.rect.x, tile.rect.y, tile.rect.w, tile.rect.h + sp(1.8), 2, 2, "F");
      doc.setDrawColor(...LINE);
      doc.roundedRect(tile.rect.x, tile.rect.y, tile.rect.w, tile.rect.h + sp(1.8), 2, 2, "S");
      await drawContainImage(doc, tile.src, {
        x: tile.rect.x + 1,
        y: tile.rect.y + 1,
        w: tile.rect.w - 2,
        h: tile.rect.h - 2,
      });
      if (tile.caption.trim()) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...MUTED);
        const cap = wrapLines(doc, tile.caption, tile.rect.w - 2, 1);
        doc.text(cap, tile.rect.x + tile.rect.w / 2, tile.rect.y + tile.rect.h + sp(1.3), { align: "center" });
      }
    }
    drawFooter(doc, s, brand, brochure.website);
    remaining = g.remaining;
    pageNo += 1;
  }

  // SPEC PAGE (table-style parity)
  doc.addPage();
  const s3 = safeArea(doc);
  drawBranding(doc, brand, brochure.logoUrl, s3, pageNo);
  await renderLogoIfAvailable(doc, brochure.logoUrl, s3);
  const titleRect3 = grid.colRect(1, 12, s3.y + sp(2), sp(3));
  const cardA = grid.colRect(1, 6, s3.y + sp(6), sp(10.6));
  const cardB = grid.colRect(7, 6, s3.y + sp(6), sp(10.6));
  const cardC = grid.colRect(1, 6, s3.y + sp(17.3), sp(10.6));
  const cardD = grid.colRect(7, 6, s3.y + sp(17.3), sp(10.6));
  const iconRowRect = grid.colRect(1, 12, s3.y + sp(28.6), s3.h - sp(30.2));
  validateLayout(s3, [
    { name: "p3.title", rect: titleRect3 },
    { name: "p3.cardA", rect: cardA },
    { name: "p3.cardB", rect: cardB },
    { name: "p3.cardC", rect: cardC },
    { name: "p3.cardD", rect: cardD },
    { name: "p3.iconRow", rect: iconRowRect },
  ]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...BLACK);
  doc.text("SPECIFICATION", titleRect3.x, titleRect3.y + sp(2.5));

  const renderCard = (rect: Rect, title: string, rows: Array<{ label: string; value: string }>) => {
    doc.setFillColor(...WHITE);
    doc.roundedRect(rect.x, rect.y, rect.w, rect.h, 4, 4, "F");
    doc.setDrawColor(...LINE);
    doc.roundedRect(rect.x, rect.y, rect.w, rect.h, 4, 4, "S");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 53, 10);
    doc.setFontSize(8.5);
    doc.text(title.toUpperCase(), rect.x + sp(1), rect.y + sp(1.7));
    doc.setDrawColor(...LINE);
    doc.line(rect.x, rect.y + sp(2.6), rect.x + rect.w, rect.y + sp(2.6));
    let y = rect.y + sp(3.8);
    rows.forEach((r) => {
      if (!r.value.trim() || y > rect.y + rect.h - sp(2.2)) return;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.setFontSize(8.5);
      doc.text(r.label, rect.x + sp(1), y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BLACK);
      doc.setFontSize(9.5);
      const one = clampOneLineWithEllipsis(doc, r.value, rect.w * 0.5);
      doc.text(one, rect.x + rect.w - sp(1), y, { align: "right" });
      doc.setDrawColor(...LINE);
      doc.line(rect.x, y + sp(0.9), rect.x + rect.w, y + sp(0.9));
      y += sp(3.4);
    });
  };

  renderCard(cardA, "Powertrain", [
    { label: "Motor", value: brochure.motor },
    { label: "Speed", value: brochure.speed },
    { label: "Chassis", value: brochure.chassis },
    { label: "Suspension", value: brochure.suspension },
  ]);
  renderCard(cardB, "Ride", [
    { label: "Brake", value: brochure.brakeSystem },
    { label: "Tyre", value: brochure.tyre },
    { label: "Tyre Size", value: `${brochure.tyreSizeFront || ""} ${brochure.tyreSizeRear || ""}`.trim() },
    { label: "Weight", value: brochure.weight },
  ]);
  renderCard(cardC, "Battery", [
    { label: "Battery", value: brochure.battery },
    { label: "Charger", value: brochure.charger },
    { label: "Lithium", value: brochure.chargingTimeLithium },
    { label: "Lead Acid", value: brochure.chargingTimeLeadAcid },
    { label: "Head Light", value: brochure.headLight },
  ]);

  doc.setFillColor(...WHITE);
  doc.roundedRect(cardD.x, cardD.y, cardD.w, cardD.h, 4, 4, "F");
  doc.setDrawColor(...LINE);
  doc.roundedRect(cardD.x, cardD.y, cardD.w, cardD.h, 4, 4, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(185, 53, 10);
  doc.text("SAFETY & FEATURES", cardD.x + sp(1), cardD.y + sp(1.7));
  doc.setDrawColor(...LINE);
  doc.line(cardD.x, cardD.y + sp(2.6), cardD.x + cardD.w, cardD.y + sp(2.6));
  let fY = cardD.y + sp(3.6);
  KEY_FEATURE_LABELS.forEach(({ key, label }) => {
    if (fY > cardD.y + cardD.h - sp(2)) return;
    const enabled = Boolean(brochure.keyFeatures[key]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text(label, cardD.x + sp(1), fY);
    const chipFill: [number, number, number] = enabled ? [...ORANGE] as [number, number, number] : [245, 245, 245];
    const chipText: [number, number, number] = enabled ? [...WHITE] as [number, number, number] : [...ORANGE] as [number, number, number];
    doc.setFillColor(...chipFill);
    doc.roundedRect(cardD.x + cardD.w - sp(3), fY - sp(1.2), sp(2.2), sp(1.8), 0.8, 0.8, "F");
    doc.setTextColor(...chipText);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(enabled ? "YES" : "NO", cardD.x + cardD.w - sp(1.9), fY - 0.2, { align: "center" });
    doc.setDrawColor(...LINE);
    doc.line(cardD.x, fY + sp(0.9), cardD.x + cardD.w, fY + sp(0.9));
    fY += sp(2.2);
  });

  // Icon row
  const iconItems = brochure.highlightFeatures.length
    ? brochure.highlightFeatures.slice(0, 4)
    : ["Efficient Batteries", "Disc / Drum Brake", "Quick Charge", "Tubeless Tyre"];
  const iconW = (iconRowRect.w - GUTTER_MM * 3) / 4;
  iconItems.forEach((item, idx) => {
    const ix = iconRowRect.x + idx * (iconW + GUTTER_MM);
    const iy = iconRowRect.y;
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.8);
    doc.circle(ix + iconW / 2, iy + sp(2.2), sp(1.2), "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(...BLACK);
    const two = wrapLines(doc, item, iconW - sp(1), 2);
    doc.text(two, ix + iconW / 2, iy + sp(4.5), { align: "center" });
  });
  drawFooter(doc, s3, brand, brochure.website);
  pageNo += 1;

  // FINAL PAGE (About + contact + CTA + QR)
  doc.addPage();
  const s4 = safeArea(doc);
  drawBranding(doc, brand, brochure.logoUrl, s4, pageNo);
  await renderLogoIfAvailable(doc, brochure.logoUrl, s4);
  const aboutRect = grid.colRect(1, 7, s4.y + sp(3), sp(11.5));
  const infoRect = grid.colRect(1, 7, s4.y + sp(15.2), sp(10.8));
  const productRect = grid.colRect(8, 5, s4.y + sp(15.2), sp(10.8));
  const socialRect = grid.colRect(1, 12, s4.y + sp(26.8), s4.h - sp(28.4));
  validateLayout(s4, [
    { name: "p4.about", rect: aboutRect },
    { name: "p4.info", rect: infoRect },
    { name: "p4.product", rect: productRect },
    { name: "p4.social", rect: socialRect },
  ]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...ORANGE);
  doc.text(`ABOUT ${brand.toUpperCase()}`, aboutRect.x, aboutRect.y + sp(2.1));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  const mission = wrapLines(doc, brochure.mission || "Build clean and premium electric mobility.", aboutRect.w, 3);
  doc.text(mission, aboutRect.x, aboutRect.y + sp(4.5));
  const about = wrapLines(doc, brochure.companyDescription || "Electric two-wheeler brand focused on sustainability and rider comfort.", aboutRect.w, 7);
  doc.text(about, aboutRect.x, aboutRect.y + sp(8.4));

  doc.setFillColor(...WHITE);
  doc.roundedRect(infoRect.x, infoRect.y, infoRect.w, infoRect.h, 4, 4, "F");
  doc.setDrawColor(...LINE);
  doc.roundedRect(infoRect.x, infoRect.y, infoRect.w, infoRect.h, 4, 4, "S");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.setFontSize(10);
  doc.text("Address", infoRect.x + sp(1), infoRect.y + sp(1.8));
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(9.5);
  doc.text(wrapLines(doc, brochure.address || "-", infoRect.w - sp(2), 2), infoRect.x + sp(1), infoRect.y + sp(3.2));
  doc.text(`Phone: ${brochure.phone || "-"}`, infoRect.x + sp(1), infoRect.y + sp(6.4));
  doc.text(`Email: ${brochure.email || "-"}`, infoRect.x + sp(1), infoRect.y + sp(8.2));
  doc.text(`Website: ${brochure.website || "-"}`, infoRect.x + sp(1), infoRect.y + sp(10));

  doc.setFillColor(...WHITE);
  doc.roundedRect(productRect.x, productRect.y, productRect.w, productRect.h, 4, 4, "F");
  doc.setDrawColor(...LINE);
  doc.roundedRect(productRect.x, productRect.y, productRect.w, productRect.h, 4, 4, "S");
  if (coverImage) {
    await drawContainImage(doc, coverImage, {
      x: productRect.x + sp(0.8),
      y: productRect.y + sp(0.8),
      w: productRect.w - sp(1.6),
      h: sp(10),
    });
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...BLACK);
  doc.text((product.name || "MODEL").toUpperCase(), productRect.x + sp(1), productRect.y + sp(12.2));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(wrapLines(doc, product.tagline || "Clean Energy Commuting", productRect.w - sp(2), 2), productRect.x + sp(1), productRect.y + sp(13.9));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ORANGE);
  doc.text(price, productRect.x + sp(1), productRect.y + productRect.h - sp(1.4));

  doc.setFillColor(...WHITE);
  doc.roundedRect(socialRect.x, socialRect.y, socialRect.w, socialRect.h, 4, 4, "F");
  doc.setDrawColor(...LINE);
  doc.roundedRect(socialRect.x, socialRect.y, socialRect.w, socialRect.h, 4, 4, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text("SCAN QR", socialRect.x + sp(1), socialRect.y + sp(1.8));

  if (brochure.qrCodeUrl) {
    const qr = await getBase64Image(brochure.qrCodeUrl);
    if (qr) {
      await drawContainImage(doc, qr, { x: socialRect.x + socialRect.w - sp(5), y: socialRect.y + sp(1), w: sp(4), h: sp(4) });
    }
  } else {
    doc.setDrawColor(...LINE);
    doc.roundedRect(socialRect.x + socialRect.w - sp(5), socialRect.y + sp(1), sp(4), sp(4), 1, 1, "S");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text("QR", socialRect.x + socialRect.w - sp(3), socialRect.y + sp(3.4), { align: "center" });
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  const socials = brochure.socialLinks.length ? brochure.socialLinks.join("  •  ") : "Instagram · Facebook · YouTube";
  doc.text(wrapLines(doc, socials, socialRect.w - sp(9), 2), socialRect.x + sp(1), socialRect.y + sp(3.8));
  doc.text(
    wrapLines(doc, "Scan to explore the full range, book a test ride, and find your nearest dealer.", socialRect.w - sp(9), 2),
    socialRect.x + sp(1),
    socialRect.y + sp(6.4)
  );

  drawFooter(doc, s4, brand, brochure.website);
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
