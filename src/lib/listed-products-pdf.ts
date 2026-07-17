import type { ListedProduct } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";

async function getBase64Image(url: string): Promise<string |null> {
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
  const productsWithImages = await Promise.all(
    products.map(async (product) => ({
      ...product,
      image: product.imageUrl
        ? await getBase64Image(product.imageUrl)
        : null,
    }))
  );
  
  
  autoTable(doc, {
    startY: 66,

    head: [["#", "Image", "Product Name", "Price"]],

    body: productsWithImages.map((product, index) => [
  index + 1,
  "",
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
      0: {
        cellWidth: 15,
        halign: "center",
      },
    
      1: {
        cellWidth: 45,
        minCellHeight: 20, // Image
        halign: "center",
      },
    
      2: {
        cellWidth: 85, // Product Name
        halign: "left",
      },
    
      3: {
        cellWidth: 42, // Price
        halign: "right",
      },
    },

    margin: {
      left: 14,
      right: 14,
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const img = productsWithImages[data.row.index].image;
    
        if (!img) return;
    
        try {
          const size = 18;
    
          const x =
            data.cell.x + (data.cell.width - size) / 2;
    
          const y =
            data.cell.y + (data.cell.height - size) / 2;
    
          const format = img.startsWith("data:image/png")
            ? "PNG"
            : "JPEG";
    
          doc.addImage(img, format, x, y, size, size);
        } catch (err) {
          console.log(err);
        }
      }
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