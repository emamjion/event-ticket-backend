import bwipjs from "bwip-js";
import fs from "fs";
import path from "path";
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

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const ticketHeight = 600;

    // Background
    doc.rect(0, 0, pageWidth, pageHeight).fill("#f7fafc");

    // Ticket container
    doc.fillColor("#ffffff");
    doc.roundedRect(margin, margin, contentWidth, ticketHeight, 8).fill();
    doc.lineWidth(1.5).strokeColor("#e5e7eb");
    doc.roundedRect(margin, margin, contentWidth, ticketHeight, 8).stroke();

    // Header
    const headerHeight = 80;
    doc.fillColor("#6c757d");
    doc.roundedRect(margin, margin, contentWidth, headerHeight, 8).fill();
    doc.rect(margin, margin + headerHeight - 8, contentWidth, 8).fill();

    // Add real logo
    const logoPath = path.resolve("public/events-logo.png");
    const logoWidth = 60;
    const logoHeight = 60;
    const logoX = margin + 30;
    const logoY = margin + (headerHeight - logoHeight) / 2;

    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, logoX, logoY, {
          width: logoWidth,
          height: logoHeight,
        });
      } catch (e) {
        console.error("Logo image error:", e);
      }
    }

    // Event title
    const eventTitle = event?.title || "Event";
    const displayTitle =
      eventTitle.length > 25 ? eventTitle.slice(0, 22) + "..." : eventTitle;

    const titleFontSize = 18;
    const titleX = logoX + logoWidth + 15;
    const titleY = logoY + (logoHeight - titleFontSize) / 2;

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(titleFontSize);
    doc.text(displayTitle, titleX, titleY);

    // Ticket badge
    const badgeWidth = 80;
    const badgeHeight = 30;
    const badgeX = margin + contentWidth - badgeWidth - 60;
    const badgeY = margin + 25;

    doc.fillColor("#495057");
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 5).fill();
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    const badgeText = "1 TICKET";
    const badgeTextWidth = doc.widthOfString(badgeText);
    const badgeTextX = badgeX + (badgeWidth - badgeTextWidth) / 2;
    const badgeTextY = badgeY + (badgeHeight - 9) / 2;
    doc.text(badgeText, badgeTextX, badgeTextY);

    // ========== Content Section ==========
    const contentY = margin + headerHeight + 30;
    const leftColX = margin + 25;
    const rightColX = margin + contentWidth * 0.55;
    const lineHeight = 20;
    const sectionGap = 25;
    let currentY = contentY;

    const formatDate = (dateString) => {
      if (!dateString) return "Date TBA";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return dateString;
      }
    };

    const formatTime = (timeString) => {
      if (!timeString) return "Time TBA";
      try {
        let date;
        if (timeString.includes("T") || timeString.includes(" ")) {
          date = new Date(timeString);
        } else {
          const [hours, minutes] = timeString.split(":").map(Number);
          date = new Date();
          date.setHours(hours, minutes, 0, 0);
        }
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } catch {
        return timeString;
      }
    };

    // ---- LEFT COLUMN ----
    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("EVENT INFORMATION", leftColX, currentY);
    currentY += lineHeight + 5;

    doc.fillColor("#2d3748").fontSize(11).font("Helvetica");
    doc.text(
      `Date: ${formatDate(event?.date || order?.createdAt)}`,
      leftColX,
      currentY
    );
    currentY += 16;
    doc.text(`Time: ${formatTime(event?.time || "19:00")}`, leftColX, currentY);
    currentY += 16;
    doc.text(
      `Location: ${event?.location || "Location TBA"}`,
      leftColX,
      currentY
    );
    currentY += sectionGap;

    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("TICKET HOLDER", leftColX, currentY);
    currentY += lineHeight + 5;
    doc.fillColor("#2d3748").fontSize(11).font("Helvetica");
    doc.text(
      `Name: ${order?.buyerId?.name || "Guest User"}`,
      leftColX,
      currentY
    );
    currentY += 16;
    doc.text(
      `Email: ${order?.buyerId?.email || "No email provided"}`,
      leftColX,
      currentY
    );
    currentY += sectionGap;

    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("SEAT ASSIGNMENT", leftColX, currentY);
    currentY += lineHeight + 5;

    const seat = order?.seats?.[0] || {};
    const row = seat?.row || "A";
    const seatNumber = seat?.seatNumber || seat?.number || "1";
    const seatPrice =
      order?.seats?.[0]?.price ??
      order?.seats?.[0]?.seatPrice ??
      event?.ticketPrice ??
      order?.totalAmount ??
      0;
    const seatSection = seat?.section || event?.zone || "GA";
    const seatInfo =
      seat?.section && row && seatNumber
        ? `${seatSection} ${row}${seatNumber}`
        : "General Admission";

    doc.fillColor("#2d3748").fontSize(11).font("Helvetica");
    doc.text(`Seat: ${seatInfo}`, leftColX, currentY);
    currentY += 16;

    if (seat?.section && row && seatNumber) {
      doc.text(`Section: ${seatSection}`, leftColX, currentY);
      currentY += 16;
      doc.text(`Row: ${row}`, leftColX, currentY);
      currentY += 16;
      doc.text(`Seat Number: ${seatNumber}`, leftColX, currentY);
      currentY += 16;
    }
    currentY += sectionGap;

    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("ORDER DETAILS", leftColX, currentY);
    currentY += lineHeight + 5;

    doc.fillColor("#2d3748").fontSize(11).font("Helvetica");
    doc.text(
      `Order ID: ${(order?._id || "N/A").toString().substring(0, 20)}`,
      leftColX,
      currentY
    );
    currentY += 16;
    if (order?.bookingId) {
      doc.text(
        `Booking ID: ${order.bookingId.toString().substring(0, 20)}`,
        leftColX,
        currentY
      );
      currentY += 16;
    }
    const purchaseDate = new Date(order?.createdAt || Date.now());
    doc.text(
      `Purchased: ${purchaseDate.toLocaleDateString()}`,
      leftColX,
      currentY
    );

    // ---- RIGHT COLUMN ----
    doc.strokeColor("#e5e7eb").lineWidth(1);
    doc
      .moveTo(rightColX - 20, contentY - 20)
      .lineTo(rightColX - 20, contentY + 350)
      .stroke();

    let rightY = contentY;
    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("PAYMENT", rightColX, rightY);
    rightY += 24;
    // doc
    //   .fillColor(order?.cancelled ? "#ef4444" : "#6c757d")
    //   .fontSize(28)
    //   .font("Helvetica-Bold");
    // doc.text(`$${(order?.totalAmount || 0).toFixed(2)}`, rightColX, rightY);
    // rightY += 45;

    doc
      .fillColor(order?.cancelled ? "#ef4444" : "#6c757d")
      .fontSize(28)
      .font("Helvetica-Bold");
    doc.text(`$${seatPrice.toFixed(2)}`, rightColX, rightY);
    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("VALIDATION", rightColX, rightY);
    rightY += 18;

    doc.fillColor("#6c757d").fontSize(10).font("Helvetica-Bold");
    doc.text("BARCODE", rightColX, rightY);
    rightY += 18;

    const barcodeWidth = 150;
    const barcodeHeight = 50;

    doc
      .fillColor("#fafafa")
      .rect(rightColX, rightY, barcodeWidth, barcodeHeight)
      .fill();
    doc.strokeColor("#e5e7eb").lineWidth(1);
    doc.rect(rightColX, rightY, barcodeWidth, barcodeHeight).stroke();

    if (barcodeBuffer) {
      try {
        doc.image(barcodeBuffer, rightColX + 10, rightY + 8, {
          width: barcodeWidth - 20,
          height: barcodeHeight - 16,
        });
      } catch (e) {
        console.error("Barcode image error:", e);
        doc.fillColor("#2d3748").fontSize(10).font("Courier");
        doc.text(
          order?.ticketCode || "000000000000",
          rightColX + 20,
          rightY + 22
        );
      }
    }

    rightY += barcodeHeight + 10;
    doc.fillColor("#2d3748").fontSize(9).font("Helvetica");
    const barcodeText = order?.ticketCode || "000000000000";
    doc.text(barcodeText, rightColX + barcodeWidth / 2 - 40, rightY, {
      width: 80,
      align: "center",
    });

    // ---- Footer ----
    const footerY = margin + ticketHeight - 100;
    const footerHeight = 100;
    doc
      .fillColor("#f7fafc")
      .rect(margin, footerY, contentWidth, footerHeight)
      .fill();
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .moveTo(margin, footerY)
      .lineTo(margin + contentWidth, footerY)
      .stroke();

    doc.fillColor("#2d3748").fontSize(9).font("Helvetica");
    const isValidTicket = !order?.cancelled;
    const footerCenterX = margin + contentWidth / 2;

    doc.text(
      "This ticket is valid for entry to the specified event.",
      footerCenterX - 200,
      footerY + 20,
      { width: 400, align: "center" }
    );
    doc.text(
      isValidTicket
        ? "Present this ticket along with valid ID at the venue entrance."
        : "This ticket has been cancelled. Entry will be denied.",
      footerCenterX - 200,
      footerY + 38,
      { width: 400, align: "center" }
    );
    doc.text(
      "For support, contact: info@eventsntickets.com.au",
      footerCenterX - 200,
      footerY + 56,
      {
        width: 400,
        align: "center",
      }
    );

    // Watermark
    if (order?.cancelled) {
      doc.fontSize(70).font("Helvetica-Bold").fillColor("#ef4444").opacity(0.2);
      doc.text("CANCELLED", pageWidth / 2 - 120, pageHeight / 2 - 35, {
        width: 240,
        align: "center",
      });
      doc.opacity(1);
    }

    doc.end();
  });
};

export default generateOrderTicketPDF;
