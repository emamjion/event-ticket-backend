import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";

// For ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoicePDF = async (order, event, customer) => {
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
    // ENHANCED PDF DESIGN
    // ========================
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 25;
    const contentWidth = pageWidth - margin * 2;

    // Enhanced color palette
    const colors = {
      primary: "#f97316", // Orange
      primaryDark: "#ea580c", // Dark Orange
      primaryLight: "#fed7aa", // Light Orange
      secondary: "#1f2937", // Dark Gray
      white: "#ffffff",
      gray: "#6b7280",
      grayLight: "#f3f4f6",
      grayMedium: "#d1d5db",
      grayDark: "#374151",
      black: "#111827",
      success: "#10b981",
      accent: "#3b82f6", // Blue
      background: "#fafafa",
    };

    // Helper functions for colors
    const setFillColor = (color) => doc.fillColor(color);
    const setStrokeColor = (color) => doc.strokeColor(color);

    // Background with subtle pattern
    setFillColor(colors.background);
    doc.rect(0, 0, pageWidth, pageHeight).fill();

    // Add subtle background pattern
    setStrokeColor(colors.grayLight);
    doc.lineWidth(0.5);
    for (let i = 0; i < pageWidth; i += 40) {
      doc.moveTo(i, 0).lineTo(i, pageHeight).stroke();
    }
    for (let i = 0; i < pageHeight; i += 40) {
      doc.moveTo(0, i).lineTo(pageWidth, i).stroke();
    }

    // Main content card with shadow effect
    const cardY = 30;
    const cardHeight = pageHeight - 60;

    // Shadow effect
    setFillColor("#00000015");
    doc.roundedRect(margin + 3, cardY + 3, contentWidth, cardHeight, 12).fill();

    // Main card
    setFillColor(colors.white);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 12).fill();

    // Card border
    setStrokeColor(colors.grayMedium);
    doc.lineWidth(1);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 12).stroke();

    // ========================
    // HEADER SECTION
    // ========================
    const headerHeight = 140;

    // Gradient header background
    setFillColor(colors.primary);
    doc.roundedRect(margin, cardY, contentWidth, headerHeight, 12).fill();

    // Fix bottom corners of header
    doc.rect(margin, cardY + headerHeight - 12, contentWidth, 12).fill();

    // Header decoration - diagonal lines
    setStrokeColor(colors.primaryDark);
    doc.lineWidth(2);
    for (let i = 0; i < contentWidth; i += 30) {
      doc
        .moveTo(margin + i, cardY)
        .lineTo(margin + i + 20, cardY + 40)
        .stroke();
    }

    // Logo section
    try {
      const logoPath = path.join(__dirname, "../../../../assets/logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin + 40, cardY + 25, { width: 50, height: 50 });
      } else {
        // Fallback logo
        setFillColor(colors.white);
        doc.circle(margin + 65, cardY + 50, 25).fill();
        setFillColor(colors.primary);
        doc.fontSize(16).font("Helvetica-Bold");
        doc.text("LOGO", margin + 65, cardY + 45, { align: "center" });
      }
    } catch (logoError) {
      // Fallback logo
      setFillColor(colors.white);
      doc.circle(margin + 65, cardY + 50, 25).fill();
      setFillColor(colors.primary);
      doc.fontSize(16).font("Helvetica-Bold");
      doc.text("LOGO", margin + 65, cardY + 45, { align: "center" });
    }

    // Company info
    setFillColor(colors.white);
    doc.fontSize(12).font("Helvetica");
    doc.text("Events & Tickets", margin + 130, cardY + 35);
    doc.fontSize(10);
    doc.text("info@eventsntickets.com.au", margin + 130, cardY + 50);
    doc.text("www.eventsntickets.com.au", margin + 130, cardY + 65);

    // Invoice title
    setFillColor(colors.white);
    doc.fontSize(48).font("Helvetica-Bold");
    doc.text("INVOICE", margin + 40, cardY + 90);

    // Invoice details box
    const detailsBoxWidth = 200;
    const detailsBoxHeight = 90;
    const detailsBoxX = margin + contentWidth - detailsBoxWidth - 30;
    const detailsBoxY = cardY + 25;

    // Details box background
    setFillColor(colors.white);
    doc
      .roundedRect(
        detailsBoxX,
        detailsBoxY,
        detailsBoxWidth,
        detailsBoxHeight,
        8
      )
      .fill();

    // Details box border
    setStrokeColor(colors.primaryDark);
    doc.lineWidth(2);
    doc
      .roundedRect(
        detailsBoxX,
        detailsBoxY,
        detailsBoxWidth,
        detailsBoxHeight,
        8
      )
      .stroke();

    // Invoice details
    setFillColor(colors.secondary);
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Invoice Details", detailsBoxX + 15, detailsBoxY + 15);

    doc.fontSize(10).font("Helvetica");
    doc.text(
      `Invoice No: ${
        order.invoiceNumber || `INV-${order._id?.toString().slice(-8)}`
      }`,
      detailsBoxX + 15,
      detailsBoxY + 35
    );
    doc.text(
      `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`,
      detailsBoxX + 15,
      detailsBoxY + 50
    );
    doc.text(
      `Order ID: ${order._id?.toString().slice(-8)}`,
      detailsBoxX + 15,
      detailsBoxY + 65
    );

    // ========================
    // CONTENT AREA
    // ========================
    let currentY = cardY + headerHeight + 30;
    const leftColX = margin + 40;
    const rightColX = margin + contentWidth * 0.6;

    // Event Information Section
    setFillColor(colors.primary);
    doc.fontSize(16).font("Helvetica-Bold");
    doc.text("📅 Event Information", leftColX, currentY);
    currentY += 25;

    // Event info card
    setFillColor(colors.grayLight);
    doc.roundedRect(leftColX, currentY, contentWidth - 80, 100, 8).fill();

    // Event info border
    setStrokeColor(colors.grayMedium);
    doc.lineWidth(1);
    doc.roundedRect(leftColX, currentY, contentWidth - 80, 100, 8).stroke();

    // Event details
    setFillColor(colors.secondary);
    doc.fontSize(18).font("Helvetica-Bold");
    doc.text(event.title || "Event Title", leftColX + 20, currentY + 20);

    setFillColor(colors.gray);
    doc.fontSize(11).font("Helvetica");
    doc.text(
      `📅 Date: ${formatDate(event.date)}`,
      leftColX + 20,
      currentY + 45
    );
    doc.text(
      `🕐 Time: ${formatTime(event.time)}`,
      leftColX + 20,
      currentY + 60
    );
    doc.text(
      `📍 Location: ${event.location || "Venue TBA"}`,
      leftColX + 20,
      currentY + 75,
      {
        width: contentWidth - 120,
      }
    );

    currentY += 130;

    // Two column layout for billing info
    // Left column - Customer info
    setFillColor(colors.primary);
    doc.fontSize(16).font("Helvetica-Bold");
    doc.text("👤 Bill To", leftColX, currentY);
    currentY += 25;

    // Customer info card
    setFillColor(colors.accent);
    doc
      .roundedRect(leftColX, currentY, (contentWidth - 80) * 0.45, 120, 8)
      .fill();

    setFillColor(colors.white);
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text(
      customer.name || order.buyerId?.name || "Customer",
      leftColX + 15,
      currentY + 20
    );

    doc.fontSize(11).font("Helvetica");
    doc.text(
      `📧 ${customer.email || order.buyerId?.email || "N/A"}`,
      leftColX + 15,
      currentY + 45
    );
    doc.text(
      `📞 ${customer.phone || order.buyerId?.phone || "N/A"}`,
      leftColX + 15,
      currentY + 65
    );
    doc.text(
      `🆔 Customer ID: ${
        customer.id || order.buyerId?._id?.toString().slice(-8) || "N/A"
      }`,
      leftColX + 15,
      currentY + 85
    );

    // Right column - Payment info
    const paymentBoxX = rightColX;

    setFillColor(colors.primary);
    doc.fontSize(16).font("Helvetica-Bold");
    doc.text("💳 Payment Summary", paymentBoxX, currentY);

    // Payment summary card
    setFillColor(colors.success);
    doc
      .roundedRect(
        paymentBoxX,
        currentY + 25,
        (contentWidth - 80) * 0.35,
        120,
        8
      )
      .fill();

    setFillColor(colors.white);
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Total Amount", paymentBoxX + 15, currentY + 45);

    doc.fontSize(28).font("Helvetica-Bold");
    doc.text(
      `$${(order.totalAmount || 0).toFixed(2)}`,
      paymentBoxX + 15,
      currentY + 65
    );

    doc.fontSize(10).font("Helvetica");
    doc.text(
      `Payment Status: ${order.paymentStatus || "Completed"}`,
      paymentBoxX + 15,
      currentY + 105
    );
    doc.text(
      `Method: ${order.paymentMethod || "Credit Card"}`,
      paymentBoxX + 15,
      currentY + 120
    );

    currentY += 170;

    // ========================
    // TICKETS TABLE
    // ========================
    setFillColor(colors.primary);
    doc.fontSize(16).font("Helvetica-Bold");
    doc.text("🎫 Ticket Details", leftColX, currentY);
    currentY += 25;

    // Table header
    const tableStartY = currentY;
    const tableWidth = contentWidth - 80;
    const rowHeight = 45;

    setFillColor(colors.secondary);
    doc.roundedRect(leftColX, currentY, tableWidth, rowHeight, 8).fill();

    // Table header text
    setFillColor(colors.white);
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Ticket Information", leftColX + 20, currentY + 15);
    doc.text("Seat Details", leftColX + 250, currentY + 15);
    doc.text("Price", leftColX + 400, currentY + 15);
    doc.text("Actions", leftColX + 480, currentY + 15);

    currentY += rowHeight;

    // Table rows
    const seats = order.seats || [
      { section: "GA", row: "1", seatNumber: "1", price: order.totalAmount },
    ];

    seats.forEach((seat, index) => {
      const rowColor = index % 2 === 0 ? colors.white : colors.grayLight;

      setFillColor(rowColor);
      doc.rect(leftColX, currentY, tableWidth, rowHeight).fill();

      // Row border
      setStrokeColor(colors.grayMedium);
      doc.lineWidth(0.5);
      doc.rect(leftColX, currentY, tableWidth, rowHeight).stroke();

      // Ticket info
      setFillColor(colors.secondary);
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text(`Ticket #${index + 1}`, leftColX + 20, currentY + 10);

      setFillColor(colors.gray);
      doc.fontSize(9).font("Helvetica");
      doc.text(
        `Event: ${event.title || "Event"}`,
        leftColX + 20,
        currentY + 25
      );

      // Seat details
      setFillColor(colors.secondary);
      doc.fontSize(10).font("Helvetica-Bold");
      const seatInfo =
        seat.section && seat.row && seat.seatNumber
          ? `${seat.section} ${seat.row}${seat.seatNumber}`
          : "General Admission";
      doc.text(seatInfo, leftColX + 250, currentY + 15);

      // Price
      setFillColor(colors.primary);
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text(
        `$${(seat.price || order.totalAmount / seats.length).toFixed(2)}`,
        leftColX + 400,
        currentY + 15
      );

      // Action button
      setFillColor(colors.accent);
      doc.roundedRect(leftColX + 480, currentY + 8, 80, 25, 4).fill();

      setFillColor(colors.white);
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("VIEW TICKET", leftColX + 485, currentY + 18);

      currentY += rowHeight;
    });

    // ========================
    // TOTALS SECTION
    // ========================
    currentY += 20;

    // Totals background
    setFillColor(colors.grayLight);
    doc.roundedRect(leftColX + tableWidth - 250, currentY, 250, 80, 8).fill();

    // Subtotal
    setFillColor(colors.gray);
    doc.fontSize(11).font("Helvetica");
    doc.text("Subtotal:", leftColX + tableWidth - 230, currentY + 15);
    doc.text(
      `$${(order.totalAmount || 0).toFixed(2)}`,
      leftColX + tableWidth - 80,
      currentY + 15
    );

    // Fees (if any)
    const fees = order.fees || 0;
    doc.text("Processing Fee:", leftColX + tableWidth - 230, currentY + 35);
    doc.text(`$${fees.toFixed(2)}`, leftColX + tableWidth - 80, currentY + 35);

    // Total line
    setStrokeColor(colors.grayMedium);
    doc.lineWidth(1);
    doc
      .moveTo(leftColX + tableWidth - 240, currentY + 50)
      .lineTo(leftColX + tableWidth - 10, currentY + 50)
      .stroke();

    // Grand Total
    setFillColor(colors.secondary);
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text("Grand Total:", leftColX + tableWidth - 230, currentY + 60);
    doc.text(
      `$${((order.totalAmount || 0) + fees).toFixed(2)}`,
      leftColX + tableWidth - 80,
      currentY + 60
    );

    // ========================
    // FOOTER SECTION
    // ========================
    const footerY = cardY + cardHeight - 100;

    // Footer background
    setFillColor(colors.grayLight);
    doc.rect(margin, footerY, contentWidth, 100).fill();

    // Footer border
    setStrokeColor(colors.grayMedium);
    doc.lineWidth(1);
    doc
      .moveTo(margin + 40, footerY + 20)
      .lineTo(margin + contentWidth - 40, footerY + 20)
      .stroke();

    // Footer content
    setFillColor(colors.gray);
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Important Information", margin + 40, footerY + 30);

    doc.fontSize(9).font("Helvetica");
    doc.text(
      "• This invoice serves as your proof of purchase for the event tickets.",
      margin + 40,
      footerY + 45
    );
    doc.text(
      "• Please download your tickets and present them at the venue entrance.",
      margin + 40,
      footerY + 57
    );
    doc.text(
      "• For support or inquiries, contact: info@eventsntickets.com.au",
      margin + 40,
      footerY + 69
    );

    // Footer decoration
    setFillColor(colors.primary);
    doc.circle(margin + contentWidth - 50, footerY + 50, 20).fill();
    setFillColor(colors.white);
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("✓", margin + contentWidth - 55, footerY + 45);

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

      if (isNaN(date.getTime())) {
        return timeString;
      }

      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return timeString;
    }
  }
};
