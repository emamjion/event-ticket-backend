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
    // PDF Layout and Design - ENHANCED TO MATCH FRONTEND
    // ========================

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 15; // Reduced margin like frontend
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    // Color palette (matching frontend exactly)
    const colors = {
      primary: [108, 117, 125], // Gray for header background
      secondary: [73, 80, 87], // Darker gray
      dark: [45, 55, 72], // Dark gray
      light: [247, 250, 252], // Light gray
      white: [255, 255, 255],
      success: [34, 197, 94], // Green
      danger: [239, 68, 68], // Red
      border: [229, 231, 235], // Border gray
      accent: [224, 88, 41], // Orange for accents
    };

    // ----- BACKGROUND AND MAIN CONTAINER -----

    // Background with subtle gradient effect
    doc.fillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.rect(0, 0, pageWidth, pageHeight).fill();

    // Main ticket card (height increased to 240 like frontend)
    doc.fillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.roundedRect(margin, margin, contentWidth, 240, 5).fill();

    // Card border
    doc.strokeColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.lineWidth(1);
    doc.roundedRect(margin, margin, contentWidth, 240, 5).stroke();

    // ----- HEADER SECTION (ENHANCED) -----

    // Main header background (35px height like frontend)
    doc.fillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, margin, contentWidth, 35, 5).fill();

    // Header bottom rectangle to square off bottom corners
    doc.rect(margin, margin + 30, contentWidth, 5).fill();

    // Logo placeholder (enhanced)
    doc.fillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.roundedRect(margin + 8, margin + 5, 24, 24, 3).fill();
    doc.fillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("LOGO", margin + 20, margin + 14, { align: "center", width: 0 });

    // Event title in header (enhanced)
    const eventTitle = event?.title || "Event";
    const displayTitle =
      eventTitle.length > 40 ? eventTitle.slice(0, 37) + "..." : eventTitle;

    doc.fillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.font("Helvetica-Bold").fontSize(14);
    doc.text(displayTitle, margin + 40, margin + 18);

    // Single ticket badge (enhanced positioning)
    const badgeWidth = 30;
    doc.fillColor(
      colors.secondary[0],
      colors.secondary[1],
      colors.secondary[2]
    );
    doc
      .roundedRect(
        margin + contentWidth - badgeWidth - 5,
        margin + 8,
        badgeWidth,
        20,
        3
      )
      .fill();

    doc.fillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.font("Helvetica-Bold").fontSize(8);
    doc.text("1 TICKET", margin + contentWidth - badgeWidth + 15, margin + 15, {
      align: "center",
      width: 0,
    });

    // ----- MAIN CONTENT AREA (REDESIGNED TO MATCH FRONTEND) -----

    const contentY = margin + 50; // Start content right after header
    const leftColWidth = contentWidth * 0.55;
    const rightColStart = margin + leftColWidth + 10;
    const rightColWidth = contentWidth * 0.4;

    // ----- LEFT COLUMN: EVENT & TICKET DETAILS -----

    let currentY = contentY;
    const lineHeight = 6;
    const sectionGap = 12;

    // Helper function to add section headers
    const addSectionHeader = (title, y) => {
      doc.fillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text(title, margin + 5, y);
      return y + 8;
    };

    // Helper function to add content text
    const addContentText = (text, y, indent = 5) => {
      doc.fillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      doc.fontSize(10).font("Helvetica");
      doc.text(text, margin + indent, y);
      return y + lineHeight;
    };

    // Helper function to format date
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

    // Helper function to format time
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

    // Section: Event Information
    currentY = addSectionHeader("EVENT INFORMATION", currentY);
    currentY = addContentText(
      `Date: ${formatDate(event?.date || order?.createdAt)}`,
      currentY
    );
    currentY = addContentText(
      `Time: ${formatTime(event?.time || "19:00")}`,
      currentY
    );
    currentY = addContentText(
      `Location: ${event?.location || "Location TBA"}`,
      currentY
    );
    currentY += sectionGap;

    // Section: Ticket Holder Information
    currentY = addSectionHeader("TICKET HOLDER", currentY);
    currentY = addContentText(
      `Name: ${order?.buyerId?.name || "Guest User"}`,
      currentY
    );
    currentY = addContentText(
      `Email: ${order?.buyerId?.email || "No email provided"}`,
      currentY
    );
    currentY += sectionGap;

    // Section: Seat Information
    currentY = addSectionHeader("SEAT ASSIGNMENT", currentY);

    const seat = order?.seats?.[0] || {};
    const row = typeof seat === "object" ? seat?.row || "A" : "A";
    const seatNumber =
      typeof seat === "object" ? seat?.seatNumber || seat?.number || "1" : "1";
    const seatSection = seat?.section || event?.zone || "GA";

    const seatInfo =
      seat?.section && seat?.row && seatNumber
        ? `${seatSection} ${row}${seatNumber}`
        : "General Admission";

    currentY = addContentText(`Seat: ${seatInfo}`, currentY);

    if (seat?.section && seat?.row && seatNumber) {
      currentY = addContentText(`Section: ${seatSection}`, currentY);
      currentY = addContentText(`Row: ${row}`, currentY);
      currentY = addContentText(`Seat Number: ${seatNumber}`, currentY);
    }
    currentY += sectionGap;

    // Section: Order Information
    currentY = addSectionHeader("ORDER DETAILS", currentY);
    const orderIdDisplay = (order?._id?.toString() || "N/A").substring(0, 20);
    currentY = addContentText(`Order ID: ${orderIdDisplay}`, currentY);

    if (order?.bookingId) {
      const bookingIdDisplay = order.bookingId.toString().substring(0, 20);
      currentY = addContentText(`Booking ID: ${bookingIdDisplay}`, currentY);
    }

    const purchaseDate = new Date(order?.createdAt || Date.now());
    currentY = addContentText(
      `Purchased: ${purchaseDate.toLocaleDateString()}`,
      currentY
    );

    // ----- RIGHT COLUMN: PRICING & VALIDATION -----

    // Right column border (subtle separator)
    doc.strokeColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.lineWidth(0.5);
    doc
      .moveTo(rightColStart - 5, contentY - 10)
      .lineTo(rightColStart - 5, contentY + 120)
      .stroke();

    let rightY = contentY;

    // Price section
    rightY = addSectionHeader("PAYMENT", rightY) - 8;
    doc.text("", rightColStart, rightY); // Reset position
    rightY += 12;

    // Total price - larger and prominent
    doc.fontSize(24).font("Helvetica-Bold");
    const isValidTicket = !order?.cancelled;
    if (isValidTicket) {
      doc.fillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    } else {
      doc.fillColor(colors.danger[0], colors.danger[1], colors.danger[2]);
    }

    const totalPrice = (order?.totalAmount || 0).toFixed(2);
    doc.text(`$${totalPrice}`, rightColStart, rightY);
    rightY += 20;

    // Validation section
    doc.fillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("VALIDATION", rightColStart, rightY);
    rightY += 10;

    // Barcode label
    doc.fillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("BARCODE", rightColStart, rightY);
    rightY += 8;

    // Barcode implementation
    if (barcodeBuffer) {
      try {
        // Create barcode background
        doc.fillColor(250, 250, 250);
        const barcodeHeight = 25;
        doc
          .rect(rightColStart, rightY, rightColWidth - 5, barcodeHeight)
          .fill();

        // Add the actual barcode image
        doc.image(barcodeBuffer, rightColStart + 2, rightY + 2, {
          width: rightColWidth - 10,
          height: barcodeHeight - 4,
        });
        rightY += barcodeHeight + 3;
      } catch (imgError) {
        console.error("Error adding barcode image:", imgError);
        // Fallback to text barcode
        doc.fillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        doc.font("Courier").fontSize(10);
        doc.text(order?.ticketCode || "000000000000", rightColStart, rightY);
        rightY += 15;
      }
    } else {
      // Generate realistic barcode pattern (same as frontend)
      const barcodeId = order?.ticketCode || "000000000000";

      // Create barcode background
      doc.fillColor(250, 250, 250);
      const barcodeHeight = 25;
      doc.rect(rightColStart, rightY, rightColWidth - 5, barcodeHeight).fill();

      // Generate barcode pattern (matching frontend logic exactly)
      const generateRealisticBarcode = (data) => {
        const bars = [];

        // Start pattern for Code 128
        bars.push({ type: "bar", width: 2 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 1 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 1 });
        bars.push({ type: "space", width: 1 });

        // Data pattern based on barcode ID
        for (let i = 0; i < data.length; i++) {
          const digit = parseInt(data[i]) || 0;

          switch (digit % 4) {
            case 0:
              bars.push({ type: "bar", width: 1 });
              bars.push({ type: "space", width: 1 });
              bars.push({ type: "bar", width: 3 });
              bars.push({ type: "space", width: 2 });
              break;
            case 1:
              bars.push({ type: "bar", width: 2 });
              bars.push({ type: "space", width: 1 });
              bars.push({ type: "bar", width: 1 });
              bars.push({ type: "space", width: 3 });
              break;
            case 2:
              bars.push({ type: "bar", width: 1 });
              bars.push({ type: "space", width: 2 });
              bars.push({ type: "bar", width: 2 });
              bars.push({ type: "space", width: 1 });
              break;
            case 3:
              bars.push({ type: "bar", width: 3 });
              bars.push({ type: "space", width: 1 });
              bars.push({ type: "bar", width: 1 });
              bars.push({ type: "space", width: 2 });
              break;
          }
        }

        // End pattern
        bars.push({ type: "bar", width: 2 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 1 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 1 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 2 });

        return bars;
      };

      const barPattern = generateRealisticBarcode(barcodeId);
      doc.fillColor(colors.dark[0], colors.dark[1], colors.dark[2]);

      let barX = rightColStart + 2;
      const totalBars = barPattern.length;
      const availableWidth = rightColWidth - 10;
      const barSpacing = availableWidth / totalBars;

      // Draw each bar
      barPattern.forEach((element) => {
        if (element.type === "bar") {
          const barWidth = element.width * 0.8;
          const barHeight = barcodeHeight * 0.8;
          const barY = rightY + (barcodeHeight - barHeight) / 2;
          doc.rect(barX, barY, barWidth, barHeight).fill();
        }
        barX += barSpacing;
      });

      rightY += barcodeHeight + 3;
    }

    // Barcode number
    doc.fillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.fontSize(8).font("Helvetica");
    const barcodeText = order?.ticketCode || "000000000000";
    doc.text(barcodeText, rightColStart + (rightColWidth - 5) / 2, rightY, {
      align: "center",
      width: 0,
    });

    // ----- FOOTER SECTION (ENHANCED) -----

    const footerY = margin + 220; // Match frontend positioning
    const footerHeight = 35;

    // Footer background
    doc.fillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.rect(margin, footerY, contentWidth, footerHeight).fill();

    // Footer border
    doc.strokeColor(colors.border[0], colors.border[1], colors.border[2]);
    doc
      .moveTo(margin, footerY)
      .lineTo(margin + contentWidth, footerY)
      .stroke();

    // Terms and conditions
    doc.fillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
    doc.fontSize(8).font("Helvetica");

    const footerText1 =
      "This ticket is valid for entry to the specified event.";
    const footerText2 = isValidTicket
      ? "Present this ticket along with valid ID at the venue entrance."
      : "This ticket has been cancelled. Entry will be denied.";
    const footerText3 = "For support, contact: info@eventsntickets.com.au";

    doc.text(footerText1, margin + contentWidth / 2, footerY + 8, {
      align: "center",
      width: 0,
    });
    doc.text(footerText2, margin + contentWidth / 2, footerY + 16, {
      align: "center",
      width: 0,
    });
    doc.text(footerText3, margin + contentWidth / 2, footerY + 24, {
      align: "center",
      width: 0,
    });

    // Watermark for cancelled tickets
    if (order?.cancelled) {
      doc.fontSize(60).font("Helvetica-Bold");
      doc.fillColor(colors.danger[0], colors.danger[1], colors.danger[2]);
      doc.opacity(0.15);
      doc.text("CANCELLED", pageWidth / 2, pageHeight / 2, {
        align: "center",
        baseline: "middle",
        width: 0,
      });
      doc.opacity(1);
    }

    doc.end();
  });
};

export default generateOrderTicketPDF;
