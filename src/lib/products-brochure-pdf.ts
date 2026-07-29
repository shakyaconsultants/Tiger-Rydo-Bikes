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

let _cachedLogoBase64: string | null | undefined;
async function loadCompanyLogo(): Promise<string | null> {
  if (_cachedLogoBase64 !== undefined) return _cachedLogoBase64;
  _cachedLogoBase64 = await getBase64Image("/images/tiger logo.png");
  return _cachedLogoBase64;
}

async function drawBranding(doc: JsPdfDoc, brandName: string, _logoUrl: string, safe: Rect, pageNo: number) {
  void _logoUrl;
  const pageW = doc.internal.pageSize.getWidth();
  // topbar accent stripe
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageW, sp(0.7), "F");

  // company logo top-left
  const logo = await loadCompanyLogo();
  if (logo) {
    await drawContainImage(doc, logo, { x: safe.x, y: safe.y - sp(2.8), w: sp(10), h: sp(4) }, false);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BLACK);
    doc.text((brandName || "Tiger Rydo").toUpperCase(), safe.x, safe.y - sp(0.4));
  }

  // page badge top-right
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

// renderLogoIfAvailable is no longer needed — logo is rendered inside drawBranding

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

  // PAGE 1 — Premium White Cover
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(...WHITE);
  doc.rect(0, 0, pw, ph, "F");
  await drawBranding(doc, brand, brochure.logoUrl, safe, 1);

  // Tagline eyebrow
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text((brochure.coverTagline || "CLEAN ENERGY COMMUTING").toUpperCase(), safe.x, safe.y + sp(3.5));

  // Large hero image — takes center stage, occupies most of the page
  const heroRect = clampRect(grid.colRect(1, 12, safe.y + sp(5.5), safe.h - sp(17)), safe);
  if (coverImage) {
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(heroRect.x, heroRect.y, heroRect.w, heroRect.h, 5, 5, "F");
    await drawContainImage(doc, coverImage, {
      x: heroRect.x + 2,
      y: heroRect.y + 2,
      w: heroRect.w - 4,
      h: heroRect.h - 4,
    }, true);
  }

  // Model name — large, vertically on the right side over the hero
  const modelName = (product.name || "MODEL").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(56);
  doc.setTextColor(240, 240, 240);
  doc.text(modelName, safe.x + safe.w - sp(1.5), safe.y + sp(8), { angle: 90 });

  // Bottom band — dark strip with speed + price + model name
  const bottomY = safe.y + safe.h - sp(9.5);
  const bottomH = sp(9.5);
  doc.setFillColor(...PANEL);
  doc.roundedRect(safe.x, bottomY, safe.w, bottomH, 4, 4, "F");

  // Speed badge (bottom-left)
  doc.setFillColor(...ORANGE);
  doc.roundedRect(safe.x + sp(1.2), bottomY + sp(1.2), sp(13), sp(3), 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(speed, safe.x + sp(1.2) + sp(6.5), bottomY + sp(3), { align: "center" });

  // Model name in bottom band
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  const modelParts = modelName.split(" ");
  if (modelParts.length > 1) {
    doc.text(modelParts[0], safe.x + sp(1.2), bottomY + sp(6.4));
    doc.setTextColor(...ORANGE);
    doc.text(modelParts.slice(1).join(" "), safe.x + sp(1.2) + doc.getTextWidth(modelParts[0] + " "), bottomY + sp(6.4));
  } else {
    doc.text(modelName, safe.x + sp(1.2), bottomY + sp(6.4));
  }

  // Tagline under model name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 180, 180);
  const tagline = clampOneLineWithEllipsis(doc, product.tagline || "Built for the City. Smart. Clean. Electric.", safe.w * 0.55);
  doc.text(tagline, safe.x + sp(1.2), bottomY + sp(8.4));

  // Price (bottom-right)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text("ON-ROAD PRICE", safe.x + safe.w - sp(1.2), bottomY + sp(2.4), { align: "right" });
  doc.setFontSize(22);
  doc.setTextColor(...ORANGE);
  doc.text(price, safe.x + safe.w - sp(1.2), bottomY + sp(5.6), { align: "right" });

  // Accent line above bottom band
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(1.2);
  doc.line(safe.x, bottomY - 1.5, safe.x + safe.w, bottomY - 1.5);

  drawFooter(doc, safe, brand, brochure.website);

  // PAGE 2 — Hero + Gallery (Mantra reference style)
  doc.addPage();
  const safe2 = safeArea(doc);
  await drawBranding(doc, brand, brochure.logoUrl, safe2, 2);
  const hasGalleryImages = gallerySources.length > 0;

  // Top: model name + description
  const p2TitleY = safe2.y + sp(3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...BLACK);
  doc.text((product.name || "MODEL").toUpperCase(), safe2.x, p2TitleY);
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.8);
  const titleW = doc.getTextWidth((product.name || "MODEL").toUpperCase());
  doc.line(safe2.x + titleW + sp(1.5), p2TitleY - sp(1.2), safe2.x + safe2.w, p2TitleY - sp(1.2));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  const story = wrapLines(
    doc,
    brochure.shortDescription || product.description || `${product.name} is built for clean urban mobility.`,
    safe2.w,
    3
  );
  doc.text(story, safe2.x, p2TitleY + sp(2));

  // Image area: large hero on left (~60%), gallery stack on right (~38%)
  const imgTopY = p2TitleY + sp(5.5);
  const imgAreaH = safe2.y + safe2.h - imgTopY - sp(2);
  const heroW = safe2.w * 0.58;
  const galleryColW = safe2.w * 0.38;
  const galleryColX = safe2.x + safe2.w - galleryColW;

  // Large hero image (cover)
  if (coverImage) {
    const heroRect2: Rect = { x: safe2.x, y: imgTopY, w: heroW, h: imgAreaH };
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(heroRect2.x, heroRect2.y, heroRect2.w, heroRect2.h, 4, 4, "F");
    await drawContainImage(doc, coverImage, {
      x: heroRect2.x + 2,
      y: heroRect2.y + 2,
      w: heroRect2.w - 4,
      h: heroRect2.h - 4,
    }, true);
    // Color label under hero
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
  }

  // Stacked gallery images on right with captions
  if (hasGalleryImages) {
    const maxSide = 3;
    const sideImages = gallerySources.slice(0, maxSide);
    const gap = GUTTER_MM;
    const sideItemH = (imgAreaH - gap * (maxSide - 1)) / maxSide;
    for (let i = 0; i < sideImages.length; i++) {
      const sy = imgTopY + i * (sideItemH + gap);
      const sideRect: Rect = { x: galleryColX, y: sy, w: galleryColW, h: sideItemH };
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(sideRect.x, sideRect.y, sideRect.w, sideRect.h, 3, 3, "F");
      await drawContainImage(doc, sideImages[i].src, {
        x: sideRect.x + 1.5,
        y: sideRect.y + 1.5,
        w: sideRect.w - 3,
        h: sideRect.h - sp(2),
      });
      // Caption label bottom-right of each tile
      const cap = sideImages[i].caption.trim();
      if (cap) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...BLACK);
        doc.text(
          clampOneLineWithEllipsis(doc, cap, sideRect.w - sp(1)),
          sideRect.x + sideRect.w - sp(0.5),
          sideRect.y + sideRect.h - sp(0.6),
          { align: "right" }
        );
      }
    }
  } else if (!coverImage) {
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(safe2.x, imgTopY, safe2.w, imgAreaH, 4, 4, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text("No images uploaded", safe2.x + safe2.w / 2, imgTopY + imgAreaH / 2, { align: "center" });
  }

  drawFooter(doc, safe2, brand, brochure.website);

  // Continuation pages for remaining gallery items (beyond 3 shown on page 2)
  const p2ShownCount = hasGalleryImages ? Math.min(3, gallerySources.length) : 0;
  const remainingSources = gallerySources.slice(p2ShownCount);
  let remaining: GalleryItem[] = remainingSources;
  let pageNo = 3;
  while (remaining.length > 0) {
    doc.addPage();
    const s = safeArea(doc);
    await drawBranding(doc, brand, brochure.logoUrl, s, pageNo);
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
        const cap = clampOneLineWithEllipsis(doc, tile.caption, tile.rect.w - 2);
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
  await drawBranding(doc, brand, brochure.logoUrl, s3, pageNo);
  const PURPLE = [126, 52, 161] as const;
  const titleRect3 = grid.colRect(1, 12, s3.y + sp(1.7), sp(3.3));
  const cardA = grid.colRect(1, 6, s3.y + sp(6), sp(9.4));
  const cardB = grid.colRect(7, 6, s3.y + sp(6), sp(9.4));
  const cardC = grid.colRect(1, 6, s3.y + sp(16.2), sp(9.4));
  const cardD = grid.colRect(7, 6, s3.y + sp(16.2), sp(9.4));
  const iconGridRect = grid.colRect(1, 12, s3.y + sp(26.5), sp(11.7));
  const colorStripRect = grid.colRect(1, 12, s3.y + sp(38.7), s3.h - sp(40.1));
  validateLayout(s3, [
    { name: "p3.title", rect: titleRect3 },
    { name: "p3.cardA", rect: cardA },
    { name: "p3.cardB", rect: cardB },
    { name: "p3.cardC", rect: cardC },
    { name: "p3.cardD", rect: cardD },
    { name: "p3.iconGrid", rect: iconGridRect },
    { name: "p3.colorStrip", rect: colorStripRect },
  ]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(...BLACK);
  doc.text("SPECIFICATION", titleRect3.x, titleRect3.y + sp(2.8));
  doc.setDrawColor(...PURPLE);
  doc.setLineWidth(0.8);
  doc.line(titleRect3.x + sp(21), titleRect3.y + sp(1.9), titleRect3.x + titleRect3.w - sp(1), titleRect3.y + sp(1.9));

  const renderCard = (rect: Rect, title: string, rows: Array<{ label: string; value: string }>) => {
    doc.setFillColor(...WHITE);
    doc.roundedRect(rect.x, rect.y, rect.w, rect.h, 4, 4, "F");
    doc.setDrawColor(...LINE);
    doc.roundedRect(rect.x, rect.y, rect.w, rect.h, 4, 4, "S");
    doc.setFillColor(...PURPLE);
    doc.rect(rect.x, rect.y, rect.w, sp(2), "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.setFontSize(8.5);
    doc.text(title.toUpperCase(), rect.x + rect.w / 2, rect.y + sp(1.35), { align: "center" });
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

  renderCard(cardA, "Electrical", [
    { label: "Speedometer", value: brochure.speedometer },
    { label: "Battery", value: brochure.battery },
    { label: "Charger", value: brochure.charger },
    { label: "Charging Time", value: `${brochure.chargingTimeLithium || "-"} / ${brochure.chargingTimeLeadAcid || "-"}` },
    { label: "Head Light", value: brochure.headLight },
  ]);
  renderCard(cardB, "Motor/Speed/Chasis/Other Feature", [
    { label: "Motor", value: brochure.motor },
    { label: "Speed", value: brochure.speed },
    { label: "Chassis", value: brochure.chassis },
    { label: "Other Feature", value: brochure.suspension },
  ]);
  renderCard(cardC, "Key Features", KEY_FEATURE_LABELS.map(({ key, label }) => ({
    label,
    value: brochure.keyFeatures[key] ? "Yes" : "No",
  })));
  renderCard(cardD, "Break / Tyre / Weight", [
    { label: "Brake", value: brochure.brakeSystem },
    { label: "Tyre", value: brochure.tyre },
    { label: "Tyre Size", value: `${brochure.tyreSizeFront || ""} ${brochure.tyreSizeRear || ""}`.trim() },
    { label: "Weight", value: brochure.weight },
  ]);

  // Expanded icon grid (2 rows x 4) so page body is filled
  const iconItems = brochure.highlightFeatures.length
    ? brochure.highlightFeatures.slice(0, 8)
    : [
        "Efficient Batteries",
        "Digital Meter",
        "Bright Headlamp",
        "Hydraulic Suspension",
        "USB Charging Port",
        "Disc/Drum Brake",
        "Quick Charge",
        "Tubeless Tyre",
      ];
  const iconCols = 4;
  const iconRows = 2;
  const iconW = (iconGridRect.w - GUTTER_MM * (iconCols - 1)) / iconCols;
  const iconCellH = iconGridRect.h / iconRows;
  for (let i = 0; i < iconCols * iconRows; i += 1) {
    const item = iconItems[i] || "";
    const row = Math.floor(i / iconCols);
    const col = i % iconCols;
    const ix = iconGridRect.x + col * (iconW + GUTTER_MM);
    const iy = iconGridRect.y + row * iconCellH;
    doc.setDrawColor(...PURPLE);
    doc.setLineWidth(0.9);
    doc.circle(ix + iconW / 2, iy + sp(2.2), sp(1.8), "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
    const two = wrapLines(doc, item, iconW - sp(0.8), 2);
    doc.text(two, ix + iconW / 2, iy + sp(5.2), { align: "center" });
  }

  // Bottom colors strip
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);
  doc.text("COLORS AVAILABLE", colorStripRect.x, colorStripRect.y + sp(1.8));
  const colorSwatches = [
    { name: "IVORY WHITE", rgb: [245, 245, 235] as [number, number, number] },
    { name: "WINE RED", rgb: [149, 12, 12] as [number, number, number] },
    { name: "METALLIC BLACK", rgb: [20, 20, 20] as [number, number, number] },
    { name: "METALLIC GREY", rgb: [138, 138, 138] as [number, number, number] },
  ];
  const swY = colorStripRect.y + sp(2.6);
  const swW = Math.min(sp(7.3), (colorStripRect.w - sp(1)) / colorSwatches.length);
  colorSwatches.forEach((sw, idx) => {
    const sx = colorStripRect.x + idx * swW;
    doc.setFillColor(...sw.rgb);
    doc.rect(sx, swY, sp(1.6), sp(1.6), "F");
    doc.setDrawColor(...LINE);
    doc.rect(sx, swY, sp(1.6), sp(1.6), "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    doc.setTextColor(...MUTED);
    doc.text(sw.name, sx + sp(2), swY + sp(1.2));
  });
  drawFooter(doc, s3, brand, brochure.website);
  pageNo += 1;

  // FINAL PAGE (About Us — dark premium style like Mantra reference)
  doc.addPage();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const s4 = safeArea(doc);

  // Upper light section — "ABOUT US" heading + mission + company description
  const aboutTopH = pageH * 0.52;
  doc.setFillColor(...SOFT_PAPER);
  doc.rect(0, 0, pageW, aboutTopH, "F");

  await drawBranding(doc, brand, brochure.logoUrl, s4, pageNo);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  doc.setTextColor(...BLACK);
  doc.text("ABOUT US", s4.x, s4.y + sp(4));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...MUTED);
  const missionText = brochure.mission || "Build clean and premium electric mobility for everyday riders.";
  const missionLines = wrapLines(doc, missionText, s4.w * 0.85, 4);
  doc.text(missionLines, s4.x, s4.y + sp(7.5));

  const aboutText = brochure.companyDescription || "Electric two-wheeler brand focused on sustainability and rider comfort.";
  const aboutLines = wrapLines(doc, aboutText, s4.w * 0.85, 10);
  doc.setFontSize(10);
  doc.text(aboutLines, s4.x, s4.y + sp(13));

  // Lower dark section — logo + contact details + QR
  doc.setFillColor(...PANEL);
  doc.rect(0, aboutTopH, pageW, pageH - aboutTopH, "F");

  const darkY = aboutTopH + sp(3);
  const darkMargin = s4.x;

  // Company logo from public folder
  const logoBase64 = await getBase64Image("/images/tiger logo.png");
  if (logoBase64) {
    await drawContainImage(doc, logoBase64, {
      x: darkMargin,
      y: darkY,
      w: sp(14),
      h: sp(6),
    }, false);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...ORANGE);
    doc.text(brand.toUpperCase(), darkMargin, darkY + sp(3.4));
  }

  // Contact details
  const contactY = darkY + sp(9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);

  const addressText = brochure.address || "-";
  doc.text("Manufacturing Unit:", darkMargin, contactY);
  doc.setFont("helvetica", "normal");
  doc.text(wrapLines(doc, addressText, s4.w * 0.6, 2), darkMargin + doc.getTextWidth("Manufacturing Unit: "), contactY);

  const contactY2 = contactY + sp(3);
  doc.setFont("helvetica", "bold");
  doc.text("Phone:", darkMargin, contactY2);
  doc.setFont("helvetica", "normal");
  doc.text(brochure.phone || "-", darkMargin + doc.getTextWidth("Phone: "), contactY2);

  const contactY3 = contactY2 + sp(1.7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Mail: ${brochure.email || "-"}  |  Web: ${brochure.website || "-"}`, darkMargin, contactY3);

  // Social links
  const socialY = contactY3 + sp(2.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  const socials = brochure.socialLinks.length ? brochure.socialLinks.join("  •  ") : "Instagram · Facebook · YouTube";
  doc.text(socials, darkMargin, socialY);

  // QR code (bottom-right of dark section)
  const qrSize = sp(7);
  const qrX = s4.x + s4.w - qrSize;
  const qrY = darkY + sp(3);
  if (brochure.qrCodeUrl) {
    const qr = await getBase64Image(brochure.qrCodeUrl);
    if (qr) {
      await drawContainImage(doc, qr, { x: qrX, y: qrY, w: qrSize, h: qrSize });
    }
  } else {
    doc.setDrawColor(80, 80, 80);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 2, 2, "S");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text("QR", qrX + qrSize / 2, qrY + qrSize / 2, { align: "center" });
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text("SCAN & VISIT", qrX + qrSize / 2, qrY + qrSize + sp(1.2), { align: "center" });
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
