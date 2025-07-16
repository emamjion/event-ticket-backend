import PDFDocument from "pdfkit";

export const generateInvoicePDF = async (order, event, customer) => {
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
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    const colors = {
      orange: "#f97316",
      orangeDark: "#ea580c",
      orangeLight: "#fed7aa",
      white: "#ffffff",
      gray: "#6b7280",
      grayLight: "#f3f4f6",
      grayDark: "#374151",
      black: "#111827",
    };

    // Background
    doc.rect(0, 0, pageWidth, pageHeight).fill(colors.grayLight);

    // Main content card
    const cardY = 20;
    const cardHeight = pageHeight - 40;
    doc.fillColor(colors.white);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 8).fill();

    // Orange header section
    const headerHeight = 120;
    doc.fillColor(colors.orange);
    doc.roundedRect(margin, cardY, contentWidth, headerHeight, 8).fill();

    // Fix bottom corners of header
    doc.rect(margin, cardY + headerHeight - 8, contentWidth, 8).fill();

    // Header content
    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(36);
    doc.text("Invoice.", margin + 30, cardY + 30);

    // Invoice details in header
    doc.fontSize(12).font("Helvetica");
    doc.text(`No: ${order.invoiceNumber}`, margin + 30, cardY + 75);
    doc.text(`Date: ${order.date}`, margin + 30, cardY + 92);

    // Total purchase box
    const totalBoxWidth = 160;
    const totalBoxHeight = 70;
    const totalBoxX = margin + contentWidth - totalBoxWidth - 30;
    const totalBoxY = cardY + 25;

    doc.fillColor(colors.orangeDark);
    doc
      .roundedRect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 6)
      .fill();

    doc.fillColor(colors.orangeLight).fontSize(10).font("Helvetica");
    doc.text("Total Purchase", totalBoxX + 10, totalBoxY + 12, {
      width: totalBoxWidth - 20,
      align: "center",
    });

    doc.fillColor(colors.white).fontSize(24).font("Helvetica-Bold");
    doc.text(
      `$${order.totalAmount.toFixed(2)}`,
      totalBoxX + 10,
      totalBoxY + 35,
      {
        width: totalBoxWidth - 20,
        align: "center",
      }
    );

    // Content area
    let currentY = cardY + headerHeight + 40;
    const leftColX = margin + 40;
    const rightColX = margin + contentWidth * 0.55;

    // Event Information Section
    doc.fillColor(colors.orange).fontSize(14).font("Helvetica-Bold");
    doc.text("Event Information", leftColX, currentY);
    currentY += 25;

    // Event info box
    doc.fillColor(colors.grayLight);
    doc.roundedRect(leftColX, currentY, contentWidth - 80, 80, 6).fill();

    doc.fillColor(colors.black).fontSize(16).font("Helvetica-Bold");
    doc.text(event.title, leftColX + 20, currentY + 15);

    doc.fillColor(colors.gray).fontSize(10).font("Helvetica");
    doc.text(`Date: ${event.date}`, leftColX + 20, currentY + 40);
    doc.text(`Location: ${event.location}`, leftColX + 20, currentY + 55, {
      width: contentWidth - 120,
      height: 20,
    });

    currentY += 120;

    // Two column layout
    // Left column - Customer info
    doc.fillColor(colors.orange).fontSize(14).font("Helvetica-Bold");
    doc.text("To", leftColX, currentY);
    currentY += 25;

    doc.fillColor(colors.black).fontSize(12).font("Helvetica-Bold");
    doc.text(customer.name, leftColX, currentY);
    currentY += 18;

    doc.fillColor(colors.gray).fontSize(10).font("Helvetica");
    doc.text(`📧 ${customer.email}`, leftColX, currentY);
    currentY += 15;
    doc.text(`📞 ${customer.phone}`, leftColX, currentY);

    // Right column - Help info
    doc.fillColor(colors.gray).fontSize(9).font("Helvetica");
    doc.text(
      "Need Help? Reply to this email",
      rightColX,
      cardY + headerHeight + 40,
      {
        link: "mailto:support@example.com",
        underline: true,
      }
    );

    doc.text(
      "*Please download the ticket by clicking the VIEW TICKET",
      rightColX,
      cardY + headerHeight + 70,
      {
        width: contentWidth * 0.4,
      }
    );
    doc.text(
      "link and print the ticket for faster check-in on the event day.",
      rightColX,
      cardY + headerHeight + 85,
      {
        width: contentWidth * 0.4,
      }
    );

    // Tickets table
    currentY = cardY + headerHeight + 200;

    // Table header
    doc.fillColor(colors.orange);
    doc.rect(leftColX, currentY, contentWidth - 80, 35).fill();

    doc.fillColor(colors.white).fontSize(12).font("Helvetica-Bold");
    doc.text("Ticket", leftColX + 20, currentY + 12);
    doc.text(
      "Price (creditCard)",
      leftColX + contentWidth - 200,
      currentY + 12
    );

    currentY += 35;

    // Table rows
    order?.seats?.forEach((ticket, index) => {
      const rowColor = index % 2 === 0 ? colors.white : colors.grayLight;
      doc.fillColor(rowColor);
      doc.rect(leftColX, currentY, contentWidth - 80, 40).fill();

      // Border
      doc.strokeColor(colors.grayLight).lineWidth(0.5);
      doc.rect(leftColX, currentY, contentWidth - 80, 40).stroke();

      doc.fillColor(colors.black).fontSize(11).font("Helvetica");
      doc.text(`${ticket.id} ( ${ticket.zone} )`, leftColX + 20, currentY + 8);

      doc.fillColor(colors.orange).fontSize(10).font("Helvetica");
      doc.text("VIEW TICKET", leftColX + 20, currentY + 25, {
        link: "#",
        underline: true,
      });

      doc.fillColor(colors.black).fontSize(11).font("Helvetica");
      doc.text(
        `$${ticket.price}`,
        leftColX + contentWidth - 200,
        currentY + 15
      );

      currentY += 40;
    });

    // Totals section
    currentY += 20;

    // Subtotal
    doc.strokeColor(colors.grayLight).lineWidth(1);
    doc
      .moveTo(leftColX + contentWidth - 300, currentY)
      .lineTo(leftColX + contentWidth - 80, currentY)
      .stroke();

    doc.fillColor(colors.gray).fontSize(11).font("Helvetica");
    doc.text("Subtotal", leftColX + contentWidth - 300, currentY + 10);
    doc.text(
      `$${order?.totalAmount?.toFixed(2)}`,
      leftColX + contentWidth - 150,
      currentY + 10
    );

    currentY += 35;

    // Grand Total
    doc.fillColor(colors.grayLight);
    doc.roundedRect(leftColX + contentWidth - 320, currentY, 240, 40, 6).fill();

    doc.fillColor(colors.black).fontSize(14).font("Helvetica-Bold");
    doc.text("Grand Total", leftColX + contentWidth - 300, currentY + 15);
    doc.fontSize(18);
    doc.text(
      `$${order.totalAmount.toFixed(2)}`,
      leftColX + contentWidth - 150,
      currentY + 12
    );

    // Footer
    const footerY = cardY + cardHeight - 80;
    doc.strokeColor(colors.grayLight).lineWidth(1);
    doc
      .moveTo(margin + 40, footerY)
      .lineTo(margin + contentWidth - 40, footerY)
      .stroke();

    doc.fillColor(colors.gray).fontSize(9).font("Helvetica");
    doc.text(
      "This ticket is valid for entry to the specified event.",
      margin + 40,
      footerY + 15,
      {
        width: contentWidth - 80,
        align: "center",
      }
    );
    doc.text(
      "Present this ticket along with valid ID at the venue entrance.",
      margin + 40,
      footerY + 30,
      {
        width: contentWidth - 80,
        align: "center",
      }
    );
    doc.text(
      "For support, contact: info@eventsntickets.com.au",
      margin + 40,
      footerY + 45,
      {
        width: contentWidth - 80,
        align: "center",
      }
    );

    doc.end();
  });
};
