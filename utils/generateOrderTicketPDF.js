import bwipjs from "bwip-js";
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
    // PDF Layout and Design - RESTORED HEIGHT
    // ========================

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const ticketHeight = 600; // INCREASED HEIGHT BACK TO SHOW ALL CONTENT

    // ----- BACKGROUND -----
    doc.rect(0, 0, pageWidth, pageHeight).fill("#f7fafc");

    // ----- MAIN TICKET CONTAINER (TALLER) -----
    doc.fillColor("#ffffff");
    doc.roundedRect(margin, margin, contentWidth, ticketHeight, 8).fill();

    // Container border
    doc.lineWidth(1.5).strokeColor("#e5e7eb");
    doc.roundedRect(margin, margin, contentWidth, ticketHeight, 8).stroke();

    // ----- HEADER SECTION -----
    const headerHeight = 80;

    // Header background
    doc.fillColor("#6c757d");
    doc.roundedRect(margin, margin, contentWidth, headerHeight, 8).fill();

    // Square off bottom of header
    doc.rect(margin, margin + headerHeight - 8, contentWidth, 8).fill();

    // Logo Section - INCREASED SIZE AND WIDTH
    const logoWidth = 60; // INCREASED width
    const logoHeight = 40; // INCREASED height
    const logoX = margin + 20;
    const logoY = margin + 20;

    doc.fillColor("#ffffff");
    doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 4).fill();

    // Logo border
    doc.lineWidth(1).strokeColor("#6c757d");
    doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 4).stroke();

    // Logo text - better centered in larger logo
    doc.fillColor("#6c757d").fontSize(12).font("Helvetica-Bold");
    const logoText = "LOGO";
    const logoTextWidth = doc.widthOfString(logoText);
    const logoTextX = logoX + (logoWidth - logoTextWidth) / 2;
    const logoTextY = logoY + (logoHeight - 12) / 2;
    doc.text(logoText, logoTextX, logoTextY);

    // Event title - adjusted for larger logo
    const eventTitle = event?.title || "Event";
    const displayTitle =
      eventTitle.length > 25 ? eventTitle.slice(0, 22) + "..." : eventTitle;

    const titleX = logoX + logoWidth + 20;
    const titleY = logoY + 12;

    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18);
    doc.text(displayTitle, titleX, titleY);

    // Ticket badge - moved further to the left and centered text
    const badgeWidth = 80;
    const badgeHeight = 30;
    const badgeX = margin + contentWidth - badgeWidth - 60; // MOVED FURTHER TO THE LEFT
    const badgeY = margin + 25;

    doc.fillColor("#495057");
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 5).fill();

    // Center the "1 TICKET" text properly
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    const badgeText = "1 TICKET";
    const badgeTextWidth = doc.widthOfString(badgeText);
    const badgeTextX = badgeX + (badgeWidth - badgeTextWidth) / 2;
    const badgeTextY = badgeY + (badgeHeight - 9) / 2;
    doc.text(badgeText, badgeTextX, badgeTextY);

    // ----- CONTENT AREA -----
    const contentY = margin + headerHeight + 30;
    const leftColX = margin + 25;
    const rightColX = margin + contentWidth * 0.55; // MOVED RIGHT COLUMN MORE TO THE LEFT
    const lineHeight = 20;
    const sectionGap = 25;

    let currentY = contentY;

    // Format helpers
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
      } catch (e) {
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
          const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
          const match = timeString.match(timeRegex);
          if (match) {
            const hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            date = new Date();
            date.setHours(hours, minutes, 0, 0);
          } else {
            date = new Date(timeString);
          }
        }
        if (isNaN(date.getTime())) return timeString;
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      } catch (e) {
        return timeString;
      }
    };

    // ----- LEFT COLUMN CONTENT -----

    // Event Information Section
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

    // Ticket Holder Section
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

    // Seat Assignment Section
    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("SEAT ASSIGNMENT", leftColX, currentY);
    currentY += lineHeight + 5;

    const seat = order?.seats?.[0] || {};
    const row = typeof seat === "object" ? seat?.row || "A" : "A";
    const seatNumber =
      typeof seat === "object" ? seat?.seatNumber || seat?.number || "1" : "1";
    const seatSection = seat?.section || event?.zone || "GA";

    const seatInfo =
      seat?.section && seat?.row && seatNumber
        ? `${seatSection} ${row}${seatNumber}`
        : "General Admission";

    doc.fillColor("#2d3748").fontSize(11).font("Helvetica");
    doc.text(`Seat: ${seatInfo}`, leftColX, currentY);
    currentY += 16;

    if (seat?.section && seat?.row && seatNumber) {
      doc.text(`Section: ${seatSection}`, leftColX, currentY);
      currentY += 16;
      doc.text(`Row: ${row}`, leftColX, currentY);
      currentY += 16;
      doc.text(`Seat Number: ${seatNumber}`, leftColX, currentY);
      currentY += 16;
    }
    currentY += sectionGap;

    // Order Details Section
    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("ORDER DETAILS", leftColX, currentY);
    currentY += lineHeight + 5;

    doc.fillColor("#2d3748").fontSize(11).font("Helvetica");
    const orderIdDisplay = (order?._id?.toString() || "N/A").substring(0, 20);
    doc.text(`Order ID: ${orderIdDisplay}`, leftColX, currentY);
    currentY += 16;

    if (order?.bookingId) {
      const bookingIdDisplay = order.bookingId.toString().substring(0, 20);
      doc.text(`Booking ID: ${bookingIdDisplay}`, leftColX, currentY);
      currentY += 16;
    }

    const purchaseDate = new Date(order?.createdAt || Date.now());
    doc.text(
      `Purchased: ${purchaseDate.toLocaleDateString()}`,
      leftColX,
      currentY
    );

    // ----- RIGHT COLUMN CONTENT -----

    // Column separator line
    doc.strokeColor("#e5e7eb").lineWidth(1);
    doc
      .moveTo(rightColX - 20, contentY - 20)
      .lineTo(rightColX - 20, contentY + 350)
      .stroke();

    let rightY = contentY;

    // Payment Section
    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("PAYMENT", rightColX, rightY);
    rightY += 24;

    // Price display
    doc.fillColor(order?.cancelled ? "#ef4444" : "#6c757d");
    doc.fontSize(28).font("Helvetica-Bold");
    const totalPrice = (order?.totalAmount || 0).toFixed(2);
    doc.text(`$${totalPrice}`, rightColX, rightY);
    rightY += 45;

    // Validation Section
    doc.fillColor("#e05829").fontSize(14).font("Helvetica-Bold");
    doc.text("VALIDATION", rightColX, rightY);
    rightY += 18;

    // Barcode label
    doc.fillColor("#6c757d").fontSize(10).font("Helvetica-Bold");
    doc.text("BARCODE", rightColX, rightY);
    rightY += 18;

    // Barcode area
    const barcodeWidth = 150;
    const barcodeHeight = 50;

    // Barcode background
    doc.fillColor("#fafafa");
    doc.rect(rightColX, rightY, barcodeWidth, barcodeHeight).fill();

    // Border around barcode
    doc.strokeColor("#e5e7eb").lineWidth(1);
    doc.rect(rightColX, rightY, barcodeWidth, barcodeHeight).stroke();

    if (barcodeBuffer) {
      try {
        doc.image(barcodeBuffer, rightColX + 10, rightY + 8, {
          width: barcodeWidth - 20,
          height: barcodeHeight - 16,
        });
      } catch (imgError) {
        console.error("Error adding barcode image:", imgError);
        doc.fillColor("#2d3748").fontSize(10).font("Courier");
        doc.text(
          order?.ticketCode || "000000000000",
          rightColX + 20,
          rightY + 22
        );
      }
    } else {
      // Manual barcode pattern
      const barcodeId = order?.ticketCode || "000000000000";
      doc.fillColor("#2d3748");

      let barX = rightColX + 20;
      const barWidth = 2.5;
      const barHeight = barcodeHeight - 20;
      const barY = rightY + 10;

      for (
        let i = 0;
        i < barcodeId.length && barX < rightColX + barcodeWidth - 20;
        i++
      ) {
        const digit = parseInt(barcodeId[i]) || 0;
        const pattern = digit % 4;

        for (let j = 0; j < 3; j++) {
          if ((pattern + j) % 2 === 0) {
            doc.rect(barX, barY, barWidth, barHeight).fill();
          }
          barX += barWidth + 1;
        }
        barX += 2.5;
      }
    }

    rightY += barcodeHeight + 10;

    // Barcode text
    doc.fillColor("#2d3748").fontSize(9).font("Helvetica");
    const barcodeText = order?.ticketCode || "000000000000";
    const textX = rightColX + barcodeWidth / 2;
    doc.text(barcodeText, textX - 40, rightY, {
      width: 80,
      align: "center",
    });

    // ----- FOOTER -----
    const footerY = margin + ticketHeight - 100; // MORE SPACE FOR FOOTER
    const footerHeight = 100;

    // Footer background
    doc.fillColor("#f7fafc");
    doc.rect(margin, footerY, contentWidth, footerHeight).fill();

    // Footer top border
    doc.strokeColor("#e5e7eb").lineWidth(1);
    doc
      .moveTo(margin, footerY)
      .lineTo(margin + contentWidth, footerY)
      .stroke();

    // Footer text
    doc.fillColor("#2d3748").fontSize(9).font("Helvetica");

    const isValidTicket = !order?.cancelled;
    const footerText1 =
      "This ticket is valid for entry to the specified event.";
    const footerText2 = isValidTicket
      ? "Present this ticket along with valid ID at the venue entrance."
      : "This ticket has been cancelled. Entry will be denied.";
    const footerText3 = "For support, contact: info@eventsntickets.com.au";

    const footerCenterX = margin + contentWidth / 2;

    doc.text(footerText1, footerCenterX - 200, footerY + 20, {
      width: 400,
      align: "center",
    });
    doc.text(footerText2, footerCenterX - 200, footerY + 38, {
      width: 400,
      align: "center",
    });
    doc.text(footerText3, footerCenterX - 200, footerY + 56, {
      width: 400,
      align: "center",
    });

    // Cancelled watermark
    if (order?.cancelled) {
      doc.fontSize(70).font("Helvetica-Bold");
      doc.fillColor("#ef4444");
      doc.opacity(0.2);
      const watermarkX = pageWidth / 2;
      const watermarkY = pageHeight / 2;
      doc.text("CANCELLED", watermarkX - 120, watermarkY - 35, {
        width: 240,
        align: "center",
      });
      doc.opacity(1);
    }

    doc.end();
  });
};

export default generateOrderTicketPDF;
