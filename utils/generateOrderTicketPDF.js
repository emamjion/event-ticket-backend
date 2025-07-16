import bwipjs from "bwip-js";
import PDFDocument from "pdfkit";

const generateOrderTicketPDF = async (order, event) => {
  let barcodeBuffer;

  try {
    // Generate realistic Code 128 barcode using the same ticketCode as frontend
    barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: order.ticketCode || "000000000000",
      scale: 3,
      height: 15,
      includetext: false, // We'll add text manually for consistency
      textxalign: "center",
    });
  } catch (err) {
    console.error("Barcode generation error:", err);
    barcodeBuffer = null;
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 0,
      size: "A4",
    });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ========================
    // EXACT MATCHING DESIGN
    // ========================

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Color palette (RGB values for PDFKit) - EXACT MATCH
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

    // Helper function to set fill color from RGB array
    const setFillColor = (colorArray) => {
      doc.fillColor(
        `rgb(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]})`
      );
    };

    const setStrokeColor = (colorArray) => {
      doc.strokeColor(
        `rgb(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]})`
      );
    };

    // ----- MAIN TICKET CONTAINER -----

    // Background with subtle gradient effect
    setFillColor(colors.light);
    doc.rect(0, 0, pageWidth, pageHeight).fill();

    // Main ticket card
    setFillColor(colors.white);
    doc.roundedRect(margin, margin, contentWidth, 240, 5).fill();

    // Card border
    setStrokeColor(colors.border);
    doc.lineWidth(1);
    doc.roundedRect(margin, margin, contentWidth, 240, 5).stroke();

    // ----- HEADER SECTION -----

    // Main header background
    setFillColor(colors.primary);
    doc.roundedRect(margin, margin, contentWidth, 35, 5).fill();

    // Header bottom rectangle to square off bottom corners
    doc.rect(margin, margin + 30, contentWidth, 5).fill();

    // Logo placeholder (you can replace with actual logo)
    setFillColor(colors.white);
    doc.circle(margin + 20, margin + 17.5, 12).fill();
    setFillColor(colors.primary);
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("LOGO", margin + 20, margin + 20, { align: "center" });

    // Event name in header
    const title = event?.title || order.eventTitle || "Event";
    let displayTitle =
      title.length > 40 ? title.substring(0, 37) + "..." : title;

    setFillColor(colors.white);
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text(displayTitle, margin + 40, margin + 18);

    // Single ticket badge
    setFillColor(colors.secondary);
    const badgeWidth = 30;
    doc
      .roundedRect(
        margin + contentWidth - badgeWidth - 5,
        margin + 8,
        badgeWidth,
        20,
        3
      )
      .fill();

    setFillColor(colors.white);
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text(
      "1 TICKET",
      margin + contentWidth - badgeWidth / 2 - 5,
      margin + 20,
      { align: "center" }
    );

    // ----- MAIN CONTENT AREA -----

    const contentY = margin + 50; // Start content right after header
    const leftColWidth = contentWidth * 0.55;
    const rightColStart = margin + leftColWidth + 10;
    const rightColWidth = contentWidth * 0.4;

    // ----- LEFT COLUMN: EVENT & TICKET DETAILS -----

    let currentY = contentY;

    // Section: Event Information
    doc.fontSize(12).font("Helvetica-Bold");
    setFillColor(colors.accent);
    doc.text("EVENT INFORMATION", margin + 5, currentY);
    currentY += 8;

    // Date & Time
    doc.fontSize(10).font("Helvetica");
    setFillColor(colors.dark);

    const eventDate = formatDate(event?.date || order.createdAt);
    const eventTime = formatTime(event?.time || "19:00");

    doc.text(`Date: ${eventDate}`, margin + 5, currentY);
    currentY += 6;
    doc.text(`Time: ${eventTime}`, margin + 5, currentY);
    currentY += 6;
    doc.text(
      `Location: ${event?.location || "Location TBA"}`,
      margin + 5,
      currentY
    );
    currentY += 12;

    // Section: Ticket Holder Information
    doc.font("Helvetica-Bold");
    setFillColor(colors.accent);
    doc.text("TICKET HOLDER", margin + 5, currentY);
    currentY += 8;

    doc.font("Helvetica");
    setFillColor(colors.dark);
    doc.text(
      `Name: ${order.buyerId?.name || "Guest User"}`,
      margin + 5,
      currentY
    );
    currentY += 6;
    doc.text(
      `Email: ${order.buyerId?.email || "No email provided"}`,
      margin + 5,
      currentY
    );
    currentY += 12;

    // Section: Seat Information
    doc.font("Helvetica-Bold");
    setFillColor(colors.accent);
    doc.text("SEAT ASSIGNMENT", margin + 5, currentY);
    currentY += 8;

    doc.font("Helvetica");
    setFillColor(colors.dark);

    const seat = order.seats?.[0] || {};
    const seatInfo = seat
      ? `${seat.section || "GA"} ${seat.row || ""}${
          seat.seatNumber || seat.number || ""
        }`
      : "General Admission";
    doc.text(`Seat: ${seatInfo}`, margin + 5, currentY);
    currentY += 6;

    if (seat?.section && seat?.row && (seat?.seatNumber || seat?.number)) {
      doc.text(`Section: ${seat.section}`, margin + 5, currentY);
      currentY += 6;
      doc.text(`Row: ${seat.row}`, margin + 5, currentY);
      currentY += 6;
      doc.text(
        `Seat Number: ${seat.seatNumber || seat.number}`,
        margin + 5,
        currentY
      );
      currentY += 6;
    }
    currentY += 6;

    // Section: Order Information
    doc.font("Helvetica-Bold");
    setFillColor(colors.accent);
    doc.text("ORDER DETAILS", margin + 5, currentY);
    currentY += 8;

    doc.font("Helvetica");
    setFillColor(colors.dark);
    const orderIdDisplay = (order._id || "N/A").toString().substring(0, 20);
    doc.text(`Order ID: ${orderIdDisplay}`, margin + 5, currentY);
    currentY += 6;

    if (order.bookingId) {
      doc.text(
        `Booking ID: ${order.bookingId.toString().substring(0, 20)}`,
        margin + 5,
        currentY
      );
      currentY += 6;
    }

    const purchaseDate = new Date(order.createdAt || Date.now());
    doc.text(
      `Purchased: ${purchaseDate.toLocaleDateString()}`,
      margin + 5,
      currentY
    );

    // ----- RIGHT COLUMN: PRICING & VALIDATION -----

    // Right column border
    setStrokeColor(colors.border);
    doc.lineWidth(0.5);
    doc
      .moveTo(rightColStart - 5, contentY - 10)
      .lineTo(rightColStart - 5, contentY + 120)
      .stroke();

    let rightY = contentY;

    // Price section
    doc.fontSize(12).font("Helvetica-Bold");
    setFillColor(colors.accent);
    doc.text("PAYMENT", rightColStart, rightY);
    rightY += 12;

    // Total price - larger and prominent
    doc.fontSize(24).font("Helvetica-Bold");
    const isValidTicket = !order.cancelled;
    setFillColor(isValidTicket ? colors.primary : colors.danger);
    const totalPrice = (order.totalAmount || 0).toFixed(2);
    doc.text(`$${totalPrice}`, rightColStart, rightY);
    rightY += 15;

    // Enhanced Barcode section
    doc.fontSize(12).font("Helvetica-Bold");
    setFillColor(colors.accent);
    doc.text("VALIDATION", rightColStart, rightY);
    rightY += 10;

    // Use the SAME ticketCode from backend
    const barcodeId = order.ticketCode || "000000000000";

    // Barcode
    doc.fontSize(9).font("Helvetica-Bold");
    setFillColor(colors.primary);
    doc.text("BARCODE", rightColStart, rightY);
    rightY += 8;

    // Create barcode background
    doc.fillColor(250, 250, 250);
    const barcodeHeight = 25;
    doc.rect(rightColStart, rightY, rightColWidth - 5, barcodeHeight).fill();

    // If we have a barcode buffer, use it
    if (barcodeBuffer) {
      const barcodeWidth = Math.min(rightColWidth - 10, 120);
      doc.image(barcodeBuffer, rightColStart + 2, rightY + 2, {
        width: barcodeWidth,
        height: barcodeHeight - 4,
      });
    } else {
      // Fallback: Generate IDENTICAL barcode pattern as React component
      const generateRealisticBarcodePDF = (data) => {
        const bars = [];

        // Start pattern for Code 128 (same as display)
        bars.push({ type: "bar", width: 2 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 1 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 1 });
        bars.push({ type: "space", width: 1 });

        // Data pattern based on barcode ID (IDENTICAL to display)
        for (let i = 0; i < data.length; i++) {
          const digit = parseInt(data[i]) || 0;

          // Create realistic barcode pattern based on digit value (SAME LOGIC)
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

        // End pattern for Code 128 (same as display)
        bars.push({ type: "bar", width: 2 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 1 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 1 });
        bars.push({ type: "space", width: 1 });
        bars.push({ type: "bar", width: 2 });

        return bars;
      };

      const barPattern = generateRealisticBarcodePDF(barcodeId);
      setFillColor(colors.dark);

      let barX = rightColStart + 2;
      const barSpacing = (rightColWidth - 10) / barPattern.length;

      // Draw each bar with exact same pattern as display
      barPattern.forEach((element, i) => {
        if (element.type === "bar") {
          const barWidth = element.width * 0.8; // Scale for PDF
          const barHeight = barcodeHeight * 0.8;
          const barY = rightY + (barcodeHeight - barHeight) / 2;

          doc.rect(barX, barY, barWidth, barHeight).fill();
        }
        barX += barSpacing;
      });
    }

    rightY += barcodeHeight + 5;

    // Barcode number - Use backend ticketCode
    doc.fontSize(8).font("Helvetica");
    setFillColor(colors.dark);
    doc.text(barcodeId, rightColStart + (rightColWidth - 5) / 2, rightY, {
      align: "center",
    });

    // ----- FOOTER SECTION -----

    const footerY = margin + 220;

    // Footer background
    setFillColor(colors.light);
    doc.rect(margin, footerY, contentWidth, 35).fill();

    // Footer border
    setStrokeColor(colors.border);
    doc
      .moveTo(margin, footerY)
      .lineTo(margin + contentWidth, footerY)
      .stroke();

    // Terms and conditions
    doc.fontSize(8).font("Helvetica");
    setFillColor(colors.dark);

    const footerText1 =
      "This ticket is valid for entry to the specified event.";
    const footerText2 = isValidTicket
      ? "Present this ticket along with valid ID at the venue entrance."
      : "This ticket has been cancelled. Entry will be denied.";
    const footerText3 = "For support, contact: info@eventsntickets.com.au";

    doc.text(footerText1, margin + contentWidth / 2, footerY + 8, {
      align: "center",
    });
    doc.text(footerText2, margin + contentWidth / 2, footerY + 16, {
      align: "center",
    });
    doc.text(footerText3, margin + contentWidth / 2, footerY + 24, {
      align: "center",
    });

    // Watermark for cancelled tickets
    if (order.cancelled) {
      doc.fontSize(60).font("Helvetica-Bold");
      doc.fillColor(220, 38, 38).opacity(0.3);
      doc.text("CANCELLED", pageWidth / 2, pageHeight / 2, { align: "center" });
      doc.opacity(1);
    }

    doc.end();
  });

  // Helper functions
  function formatDate(dateString) {
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
  }

  function formatTime(timeString) {
    if (!timeString) return "Time TBA";

    try {
      let date;

      // If it's a full datetime string
      if (timeString.includes("T") || timeString.includes(" ")) {
        date = new Date(timeString);
      } else {
        // If it's just a time string (HH:MM format)
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

      if (isNaN(date.getTime())) {
        return timeString;
      }

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return timeString;
    }
  }
};

export default generateOrderTicketPDF;
