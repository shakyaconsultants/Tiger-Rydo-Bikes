import type { ListedProduct } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";

export async function downloadListedProductsPdf(products: ListedProduct[]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // =========================
  // HEADER
  // =========================
  doc.setFillColor(255, 90, 0);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Tiger Rydo", 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Dealer Product Catalog", 14, 22);

  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN")}`,
    pageWidth - 14,
    14,
    { align: "right" }
  );

  // =========================
  // SUMMARY
  // =========================
  doc.setFillColor(246, 246, 246);
  doc.roundedRect(14, 40, pageWidth - 28, 18, 3, 3, "F");

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total Products : ${products.length}`, 20, 51);

  if (products.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.text("No products available.", 20, 70);
    doc.save("tiger-rydo-dealer-products.pdf");
    return;
  }

  // =========================
  // TABLE
  // =========================
  autoTable(doc, {
    startY: 66,

    head: [["#", "Product Name", "Price"]],

    body: products.map((product, index) => [
      index + 1,
      product.name,
      `Rs. ${new Intl.NumberFormat("en-IN").format(product.price)}`,
    ]),

    theme: "grid",

    headStyles: {
      fillColor: [255, 90, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 11,
      valign: "middle",
    },

    bodyStyles: {
      fontSize: 10,
      textColor: [45, 45, 45],
      cellPadding: 4,
      valign: "middle",
    },

    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },

    styles: {
      lineColor: [225, 225, 225],
      lineWidth: 0.25,
      overflow: "linebreak",
    },

    // Total usable width ≈ 182mm
    columnStyles: {
      // Sr No.
      0: {
        cellWidth: 18,
        halign: "center",
      },

      // Product Name (Reduced)
      1: {
        cellWidth: 92,
        halign: "left",
      },

      // Price (Increased)
      2: {
        cellWidth: 72,
        halign: "right",
      },
    },

    margin: {
      left: 14,
      right: 14,
    },

    didDrawPage: () => {
      doc.setDrawColor(220);
      doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

      doc.setFontSize(9);
      doc.setTextColor(120);

      doc.text(
        "Tiger Rydo Dealer Portal",
        14,
        pageHeight - 10
      );

      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber}`,
        pageWidth - 14,
        pageHeight - 10,
        {
          align: "right",
        }
      );
    },
  });

  doc.save("tiger-rydo-dealer-products.pdf");
}