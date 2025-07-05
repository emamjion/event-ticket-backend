import bwipjs from "bwip-js"; // Named import na, eta default import
import PDFDocument from "pdfkit";

const generateOrderTicketPDF = async (order, event) => {
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
    const doc = new PDFDocument({ margin: 0 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ========================
    // PDF Layout and Design
    // ========================

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

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

    doc.rect(0, 0, pageWidth, pageHeight).fill(colors.light);

    doc.fillColor(colors.white);
    doc.roundedRect(margin, margin, contentWidth, contentHeight, 10).fill();
    doc.lineWidth(1).strokeColor(colors.border);
    doc.roundedRect(margin, margin, contentWidth, contentHeight, 10).stroke();

    const headerHeight = 80;
    doc
      .fillColor(colors.primary)
      .roundedRect(margin, margin, contentWidth, headerHeight, 10)
      .fill();
    doc.rect(margin, margin + headerHeight - 5, contentWidth, 5).fill();

    doc.fillColor(colors.white);
    doc.roundedRect(margin + 15, margin + 15, 40, 40, 5).fill();
    doc.fillColor(colors.primary).fontSize(8).font("Helvetica-Bold");
    doc.text("LOGO", margin + 25, margin + 32);

    const eventTitle = event?.title || "Event";
    const displayTitle =
      eventTitle.length > 40 ? eventTitle.slice(0, 37) + "..." : eventTitle;

    doc
      .fillColor(colors.white)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(displayTitle, margin + 70, margin + 25);

    const badgeWidth = 80;
    doc.fillColor(colors.secondary);
    doc
      .roundedRect(
        margin + contentWidth - badgeWidth - 15,
        margin + 15,
        badgeWidth,
        30,
        4
      )
      .fill();
    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(12);
    doc.text("1 TICKET", margin + contentWidth - badgeWidth - 15, margin + 28, {
      width: badgeWidth,
      align: "center",
    });

    const paddingX = 36;
    const paddingY = 36;
    const sectionGap = 28;
    const lineGap = 16;
    const contentStartY = margin + headerHeight + paddingY;
    const leftColX = margin + paddingX;
    const rightColX = margin + contentWidth * 0.55 + paddingX;

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

    let ry = contentStartY;

    doc.fillColor(colors.accent).fontSize(12).font("Helvetica-Bold");
    doc.text("PAYMENT", rightColX, ry);
    ry += lineGap + 2;

    doc.fontSize(24).font("Helvetica-Bold");
    doc.fillColor(order.cancelled ? colors.danger : colors.primary);
    doc.text(`$${order.totalAmount?.toFixed(2) || "0.00"}`, rightColX, ry);
    ry += 32;

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
        .fontSize(12)
        .text(order.ticketCode || "000000000000", rightColX, ry);
      ry += 20;
    }

    doc.fontSize(8).font("Helvetica").fillColor(colors.dark);
    doc.text(order.ticketCode || "000000000000", rightColX, ry);

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
      {
        align: "center",
      }
    );
    doc.text(
      "Present this ticket along with valid ID at the venue entrance.",
      margin + contentWidth / 2,
      footerY + 20,
      { align: "center" }
    );
    doc.text(
      "For support, contact: info@eventsntickets.com.au",
      margin + contentWidth / 2,
      footerY + 32,
      {
        align: "center",
      }
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
