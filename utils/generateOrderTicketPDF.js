import PDFDocument from "pdfkit";

const generateOrderTicketPDF = async (order, event) => {
  const bwipjs = await import("bwip-js");

  let barcodeBuffer;
  try {
    barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: order.ticketCode || "000000000000",
      scale: 2,
      height: 10,
      includetext: true,
      textxalign: "center",
    });
  } catch (err) {
    console.error("Barcode generation error:", err);
    barcodeBuffer = null;
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0 }); // zero margin for full page use
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // === Page Dimensions ===
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    // === Colors ===
    const colors = {
      primary: "#6c757d",
      secondary: "#495057",
      dark: "#2d3748",
      light: "#f7fafc",
      white: "#ffffff",
      danger: "#ef4444",
      border: "#e5e7eb",
      accent: "#e05829",
    };

    // === Background ===
    doc.rect(0, 0, pageWidth, pageHeight).fill(colors.light);

    // === Ticket Container ===
    doc.fillColor(colors.white);
    doc.roundedRect(margin, margin, contentWidth, contentHeight, 10).fill();
    doc.lineWidth(1).strokeColor(colors.border);
    doc.roundedRect(margin, margin, contentWidth, contentHeight, 10).stroke();

    // === HEADER ===
    const headerHeight = 80;
    doc
      .fillColor(colors.primary)
      .roundedRect(margin, margin, contentWidth, headerHeight, 10)
      .fill();
    doc.rect(margin, margin + headerHeight - 5, contentWidth, 5).fill();

    const eventTitle = event?.title || "Event";
    const displayTitle =
      eventTitle.length > 40 ? eventTitle.slice(0, 37) + "..." : eventTitle;

    doc
      .fillColor(colors.white)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(displayTitle, margin + 60, margin + 18);

    // === Badge ===
    const badgeWidth = 60;
    doc.fillColor(colors.secondary);
    doc
      .roundedRect(
        margin + contentWidth - badgeWidth - 15,
        margin + 10,
        badgeWidth,
        24,
        4
      )
      .fill();
    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(10);
    doc.text(
      "1 TICKET",
      margin + contentWidth - badgeWidth / 2 - 12,
      margin + 24,
      { align: "center" }
    );

    // === Content Start ===
    const paddingX = 36;
    const paddingY = 36;
    const sectionGap = 28;
    const lineGap = 16;

    const contentStartY = margin + headerHeight + paddingY;
    const leftColX = margin + paddingX;
    const rightColX = margin + contentWidth * 0.55 + paddingX;
    const colWidth = contentWidth * 0.4 - paddingX;

    let y = contentStartY;

    doc.fillColor(colors.accent).fontSize(12).font("Helvetica-Bold");
    doc.text("EVENT INFORMATION", leftColX, y);
    y += lineGap + 2;
    doc.fillColor(colors.dark).fontSize(10).font("Helvetica");
    doc.text(`Date: ${event.date || "July 30, 2025"}`, leftColX, y);
    y += lineGap;
    doc.text(`Time: ${event.time || "2:30 PM"}`, leftColX, y);
    y += lineGap;
    doc.text(
      `Location: ${event.location || "Staples Center, LA"}`,
      leftColX,
      y
    );
    y += sectionGap;

    doc.fillColor(colors.accent).font("Helvetica-Bold");
    doc.text("TICKET HOLDER", leftColX, y);
    y += lineGap + 2;
    doc.fillColor(colors.dark).font("Helvetica");
    doc.text(`Name: ${order.buyerId?.name || "Guest User"}`, leftColX, y);
    y += lineGap;
    doc.text(`Email: ${order.buyerId?.email || "N/A"}`, leftColX, y);
    y += sectionGap;

    doc.fillColor(colors.accent).font("Helvetica-Bold");
    doc.text("SEAT ASSIGNMENT", leftColX, y);
    y += lineGap + 2;

    const seat = order.seats?.[0] || {};
    const row = typeof seat === "object" ? seat?.row || "A" : "A";
    const number = typeof seat === "object" ? seat?.number || "3" : "3";
    const seatZone = event.zone || "luminedge-zone";

    doc.fillColor(colors.dark).font("Helvetica");
    doc.text(`Seat: ${seatZone} ${row}${number}`, leftColX, y);
    y += lineGap;
    doc.text(`Section: ${seatZone}`, leftColX, y);
    y += lineGap;
    doc.text(`Row: ${row}`, leftColX, y);
    y += lineGap;
    doc.text(`Seat Number: ${number}`, leftColX, y);
    y += sectionGap;

    doc.fillColor(colors.accent).font("Helvetica-Bold");
    doc.text("ORDER DETAILS", leftColX, y);
    y += lineGap + 2;
    doc.fillColor(colors.dark).font("Helvetica");
    doc.text(`Order ID: ${order._id?.toString().slice(0, 20)}`, leftColX, y);
    y += lineGap;
    doc.text(
      `Booking ID: ${order.bookingId?.toString().slice(0, 20)}`,
      leftColX,
      y
    );
    y += lineGap;
    doc.text(
      `Purchased: ${new Date(order.createdAt).toLocaleDateString()}`,
      leftColX,
      y
    );

    // === Right Column ===
    let ry = contentStartY;
    doc.fillColor(colors.accent).fontSize(12).font("Helvetica-Bold");
    doc.text("PAYMENT", rightColX, ry);
    ry += lineGap + 2;

    doc.fontSize(24).font("Helvetica-Bold");
    doc.fillColor(order.cancelled ? colors.danger : colors.primary);
    doc.text(order.totalAmount?.toFixed(2) || "0.00", rightColX, ry);
    ry += 28;

    doc.fillColor(colors.accent).fontSize(12).font("Helvetica-Bold");
    doc.text("VALIDATION", rightColX, ry);
    ry += lineGap + 2;
    doc.fontSize(10).fillColor(colors.primary).text("BARCODE", rightColX, ry);
    ry += lineGap;

    if (barcodeBuffer) {
      doc.image(barcodeBuffer, rightColX, ry, { width: 150 });
      ry += 60;
    } else {
      doc
        .font("Courier")
        .text(order.ticketCode || "000000000000", rightColX, ry);
      ry += 12;
    }

    doc.fontSize(8).font("Helvetica").fillColor(colors.dark);
    doc.text(order.ticketCode || "000000000000", rightColX, ry);
    ry += 10;

    // === Footer ===
    const footerHeight = 60;
    const footerY = margin + contentHeight - footerHeight;
    doc
      .fillColor(colors.light)
      .rect(margin, footerY, contentWidth, footerHeight)
      .fill();
    doc
      .strokeColor(colors.border)
      .moveTo(margin, footerY)
      .lineTo(margin + contentWidth, footerY)
      .stroke();

    doc.fillColor(colors.dark).fontSize(9).font("Helvetica");
    doc.text(
      "This ticket is valid for entry to the specified event.",
      margin + contentWidth / 2,
      footerY + 8,
      { align: "center" }
    );
    doc.text(
      "Present this ticket along with valid ID at the venue entrance.",
      margin + contentWidth / 2,
      footerY + 18,
      { align: "center" }
    );
    doc.text(
      "For support, contact: info@eventsntickets.com.au",
      margin + contentWidth / 2,
      footerY + 28,
      { align: "center" }
    );

    if (order.cancelled) {
      doc.fontSize(64).fillColor(colors.danger).opacity(0.15);
      doc
        .font("Helvetica-Bold")
        .text("CANCELLED", pageWidth / 2, pageHeight / 2, {
          align: "center",
          baseline: "middle",
        });
      doc.opacity(1);
    }

    doc.end();
  });
};

export default generateOrderTicketPDF;
