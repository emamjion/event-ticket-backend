// import PDFDocument from "pdfkit";

// export const generateInvoicePDF = async (order, event, customer) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ margin: 0 });
//     const buffers = [];

//     doc.on("data", buffers.push.bind(buffers));
//     doc.on("end", () => resolve(Buffer.concat(buffers)));
//     doc.on("error", reject);

//     // ========================
//     // PDF Layout and Design
//     // ========================
//     const pageWidth = doc.page.width;
//     const pageHeight = doc.page.height;
//     const margin = 30;
//     const contentWidth = pageWidth - margin * 2;

//     const colors = {
//       orange: "#f97316",
//       orangeDark: "#ea580c",
//       orangeLight: "#fed7aa",
//       white: "#ffffff",
//       gray: "#6b7280",
//       grayLight: "#f3f4f6",
//       grayDark: "#374151",
//       black: "#111827",
//     };

//     // Background
//     doc.rect(0, 0, pageWidth, pageHeight).fill(colors.grayLight);

//     // Main content card
//     const cardY = 20;
//     const cardHeight = pageHeight - 40;
//     doc.fillColor(colors.white);
//     doc.roundedRect(margin, cardY, contentWidth, cardHeight, 8).fill();

//     // Orange header section
//     const headerHeight = 100;
//     doc.fillColor(colors.orange);
//     doc.roundedRect(margin, cardY, contentWidth, headerHeight, 8).fill();

//     // Fix bottom corners of header
//     doc.rect(margin, cardY + headerHeight - 8, contentWidth, 8).fill();

//     // Header content
//     doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(28);
//     doc.text("INVOICE", margin + 30, cardY + 30);

//     // Invoice details in header
//     doc.fontSize(10).font("Helvetica");
//     doc.text(`Invoice #: ${order.invoiceNumber}`, margin + 30, cardY + 65);
//     doc.text(`Date: ${order.date}`, margin + 30, cardY + 80);

//     // Total purchase box
//     const totalBoxWidth = 140;
//     const totalBoxHeight = 60;
//     const totalBoxX = margin + contentWidth - totalBoxWidth - 30;
//     const totalBoxY = cardY + 20;

//     doc.fillColor(colors.orangeDark);
//     doc
//       .roundedRect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 6)
//       .fill();

//     doc.fillColor(colors.orangeLight).fontSize(10).font("Helvetica");
//     doc.text("TOTAL AMOUNT", totalBoxX + 10, totalBoxY + 10, {
//       width: totalBoxWidth - 20,
//       align: "center",
//     });

//     doc.fillColor(colors.white).fontSize(20).font("Helvetica-Bold");
//     doc.text(
//       `$${order.totalAmount.toFixed(2)}`,
//       totalBoxX + 10,
//       totalBoxY + 30,
//       {
//         width: totalBoxWidth - 20,
//         align: "center",
//       }
//     );

//     // Content area
//     let currentY = cardY + headerHeight + 30;
//     const leftColX = margin + 30;
//     const rightColX = margin + contentWidth * 0.6;

//     // Two column layout - From and To
//     // From section (company info)
//     doc.fillColor(colors.orange).fontSize(10).font("Helvetica-Bold");
//     doc.text("FROM", leftColX, currentY);
//     doc.fillColor(colors.black).fontSize(10).font("Helvetica");
//     doc.text("EventsNTickets", leftColX, currentY + 15);
//     doc.text("123 Event Street", leftColX, currentY + 30);
//     doc.text("Sydney, NSW 2000", leftColX, currentY + 45);
//     doc.text("Australia", leftColX, currentY + 60);
//     doc.text("ABN: 12 345 678 901", leftColX, currentY + 75);

//     // To section (customer info)
//     doc.fillColor(colors.orange).fontSize(10).font("Helvetica-Bold");
//     doc.text("TO", rightColX, currentY);
//     doc.fillColor(colors.black).fontSize(10).font("Helvetica");
//     doc.text(customer.name, rightColX, currentY + 15);
//     doc.text(`${customer.email}`, rightColX, currentY + 30);
//     doc.text(`${customer.contactNumber}`, rightColX, currentY + 45);

//     currentY += 120;

//     // Event Information Section
//     doc.fillColor(colors.orange).fontSize(12).font("Helvetica-Bold");
//     doc.text("EVENT DETAILS", leftColX, currentY);
//     currentY += 20;

//     // Event info box
//     doc.fillColor(colors.grayLight);
//     doc.roundedRect(leftColX, currentY, contentWidth - 60, 70, 4).fill();

//     doc.fillColor(colors.black).fontSize(14).font("Helvetica-Bold");
//     doc.text(event.title, leftColX + 15, currentY + 15);

//     doc.fillColor(colors.gray).fontSize(10).font("Helvetica");
//     doc.text(`Date: ${event.date}`, leftColX + 15, currentY + 35);
//     doc.text(`Location: ${event.location}`, leftColX + 15, currentY + 50, {
//       width: contentWidth - 90,
//     });

//     currentY += 100;

//     // Tickets table header
//     doc.fillColor(colors.orange);
//     doc.rect(leftColX, currentY, contentWidth - 60, 25).fill();

//     doc.fillColor(colors.white).fontSize(10).font("Helvetica-Bold");
//     doc.text("DESCRIPTION", leftColX + 10, currentY + 8);
//     doc.text("PRICE", leftColX + contentWidth - 120, currentY + 8);
//     currentY += 25;

//     // Table rows
//     order?.seats?.forEach((ticket, index) => {
//       const rowColor = index % 2 === 0 ? colors.white : colors.grayLight;
//       doc.fillColor(rowColor);
//       doc.rect(leftColX, currentY, contentWidth - 60, 30).fill();

//       doc.fillColor(colors.black).fontSize(10).font("Helvetica");
//       doc.text(
//         `Ticket ${ticket.id} (${ticket.zone})`,
//         leftColX + 10,
//         currentY + 8
//       );
//       doc.text(`$${ticket.price}`, leftColX + contentWidth - 120, currentY + 8);

//       currentY += 30;
//     });

//     // Totals section
//     currentY += 20;

//     // Subtotal
//     doc.fillColor(colors.gray).fontSize(10).font("Helvetica");
//     doc.text("Subtotal", leftColX + contentWidth - 180, currentY + 8);
//     doc.text(
//       `$${order?.totalAmount?.toFixed(2)}`,
//       leftColX + contentWidth - 120,
//       currentY + 8
//     );

//     currentY += 20;

//     // Total
//     doc.fillColor(colors.orangeLight);
//     doc.roundedRect(leftColX + contentWidth - 180, currentY, 150, 30, 4).fill();

//     doc.fillColor(colors.black).fontSize(12).font("Helvetica-Bold");
//     doc.text("TOTAL", leftColX + contentWidth - 170, currentY + 10);
//     doc.text(
//       `$${order.totalAmount.toFixed(2)}`,
//       leftColX + contentWidth - 120,
//       currentY + 10
//     );

//     // Payment method
//     currentY += 50;
//     doc.fillColor(colors.gray).fontSize(10).font("Helvetica");
//     doc.text("Payment Method:", leftColX, currentY);
//     doc.fillColor(colors.black).fontSize(10).font("Helvetica-Bold");
//     doc.text("Credit Card", leftColX + 80, currentY);

//     // Footer
//     const footerY = cardY + cardHeight - 60;
//     doc.strokeColor(colors.grayLight).lineWidth(1);
//     doc
//       .moveTo(leftColX, footerY)
//       .lineTo(leftColX + contentWidth - 60, footerY)
//       .stroke();

//     doc.fillColor(colors.gray).fontSize(8).font("Helvetica");
//     doc.text("Thank you for your purchase!", leftColX, footerY + 10);
//     doc.text(
//       "For any questions about this invoice, please contact:",
//       leftColX,
//       footerY + 25
//     );
//     doc.text("support@eventsntickets.com.au", leftColX, footerY + 40, {
//       underline: true,
//       link: "mailto:support@eventsntickets.com.au",
//     });

//     doc.end();
//   });
// };

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

    // Calculate content height dynamically (increased height)
    const ticketCount = order?.seats?.length || 0;
    const baseContentHeight = 480;
    const ticketRowHeight = 25;
    const totalContentHeight =
      baseContentHeight + ticketCount * ticketRowHeight;
    const cardHeight = Math.min(totalContentHeight, pageHeight - 40);

    // Main content card
    const cardY = 20;
    doc.fillColor(colors.white);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 8).fill();

    // Orange header section (more compact)
    const headerHeight = 80;
    doc.fillColor(colors.orange);
    doc.roundedRect(margin, cardY, contentWidth, headerHeight, 8).fill();

    // Fix bottom corners of header
    doc.rect(margin, cardY + headerHeight - 8, contentWidth, 8).fill();

    // Header content
    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(24);
    doc.text("INVOICE", margin + 25, cardY + 25);

    // Invoice details in header (more compact)
    doc.fontSize(9).font("Helvetica");
    doc.text(
      `Invoice #: ${order.invoiceNumber || "N/A"}`,
      margin + 25,
      cardY + 50
    );
    doc.text(`Date: ${order.date || "N/A"}`, margin + 25, cardY + 62);

    // Total purchase box (smaller)
    const totalBoxWidth = 120;
    const totalBoxHeight = 50;
    const totalBoxX = margin + contentWidth - totalBoxWidth - 20;
    const totalBoxY = cardY + 15;

    doc.fillColor(colors.orangeDark);
    doc
      .roundedRect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 6)
      .fill();

    doc.fillColor(colors.orangeLight).fontSize(8).font("Helvetica");
    doc.text("TOTAL AMOUNT", totalBoxX + 8, totalBoxY + 8, {
      width: totalBoxWidth - 16,
      align: "center",
    });

    doc.fillColor(colors.white).fontSize(16).font("Helvetica-Bold");
    doc.text(
      `${(order.totalAmount || 0).toFixed(2)}`,
      totalBoxX + 8,
      totalBoxY + 25,
      {
        width: totalBoxWidth - 16,
        align: "center",
      }
    );

    // Content area (reduced spacing)
    let currentY = cardY + headerHeight + 15;
    const leftColX = margin + 25;
    const rightColX = margin + contentWidth * 0.58;

    // Two column layout - From and To (more compact)
    // From section (company info)
    doc.fillColor(colors.orange).fontSize(9).font("Helvetica-Bold");
    doc.text("FROM", leftColX, currentY);
    doc.fillColor(colors.black).fontSize(9).font("Helvetica");
    doc.text("EventsNTickets", leftColX, currentY + 12);
    doc.text("38 Liddle Street", leftColX, currentY + 24);
    doc.text("North St Marys", leftColX, currentY + 36);
    doc.text("NSW 2760", leftColX, currentY + 48);
    doc.text("ABN: 48 550 860 418", leftColX, currentY + 60);

    // To section (customer info)
    doc.fillColor(colors.orange).fontSize(9).font("Helvetica-Bold");
    doc.text("TO", rightColX, currentY);
    doc.fillColor(colors.black).fontSize(9).font("Helvetica");
    doc.text(customer.name || "N/A", rightColX, currentY + 12);
    doc.text(customer.email || "N/A", rightColX, currentY + 24);
    doc.text(
      customer.contactNumber || customer.phone || "N/A",
      rightColX,
      currentY + 36
    );

    currentY += 80;

    // Event Information Section
    doc.fillColor(colors.orange).fontSize(10).font("Helvetica-Bold");
    doc.text("EVENT DETAILS", leftColX, currentY);
    currentY += 15;

    // Event info box (more compact)
    doc.fillColor(colors.grayLight);
    doc.roundedRect(leftColX, currentY, contentWidth - 50, 55, 4).fill();

    doc.fillColor(colors.black).fontSize(12).font("Helvetica-Bold");
    doc.text(event.title || "Event Name", leftColX + 12, currentY + 12);

    doc.fillColor(colors.gray).fontSize(9).font("Helvetica");
    doc.text(`Date: ${event.date || "TBD"}`, leftColX + 12, currentY + 28);
    doc.text(
      `Location: ${event.location || "TBD"}`,
      leftColX + 12,
      currentY + 40,
      {
        width: contentWidth - 75,
      }
    );

    currentY += 70;

    // Tickets table header (more compact)
    doc.fillColor(colors.orange);
    doc.rect(leftColX, currentY, contentWidth - 50, 20).fill();

    doc.fillColor(colors.white).fontSize(9).font("Helvetica-Bold");
    doc.text("DESCRIPTION", leftColX + 8, currentY + 6);
    doc.text("PRICE", leftColX + contentWidth - 100, currentY + 6);
    currentY += 20;

    // Table rows (more compact)
    order?.seats?.forEach((ticket, index) => {
      const rowColor = index % 2 === 0 ? colors.white : colors.grayLight;
      doc.fillColor(rowColor);
      doc.rect(leftColX, currentY, contentWidth - 50, 25).fill();

      doc.fillColor(colors.black).fontSize(9).font("Helvetica");
      doc.text(
        `Ticket ${ticket.id || ticket.seatId || "N/A"} (${
          ticket.zone || ticket.section || "General"
        })`,
        leftColX + 8,
        currentY + 6
      );
      doc.text(
        `${(ticket.price || 0).toFixed(2)}`,
        leftColX + contentWidth - 100,
        currentY + 6
      );

      currentY += 25;
    });

    // Totals section (reduced spacing)
    currentY += 15;

    // Subtotal
    doc.fillColor(colors.gray).fontSize(9).font("Helvetica");
    doc.text("Subtotal", leftColX + contentWidth - 130, currentY);
    doc.text(
      `${(order?.totalAmount || 0).toFixed(2)}`,
      leftColX + contentWidth - 90,
      currentY
    );

    currentY += 15;

    // Total
    doc.fillColor(colors.orangeLight);
    doc.roundedRect(leftColX + contentWidth - 130, currentY, 100, 22, 4).fill();

    doc.fillColor(colors.black).fontSize(10).font("Helvetica-Bold");
    doc.text("TOTAL", leftColX + contentWidth - 122, currentY + 6);
    doc.text(
      `${(order.totalAmount || 0).toFixed(2)}`,
      leftColX + contentWidth - 90,
      currentY + 6
    );

    // Payment method (reduced spacing)
    currentY += 35;
    doc.fillColor(colors.gray).fontSize(9).font("Helvetica");
    doc.text("Payment Method:", leftColX, currentY);
    doc.fillColor(colors.black).fontSize(9).font("Helvetica-Bold");
    doc.text("Credit Card", leftColX + 75, currentY);

    // Footer (positioned at bottom of content, not fixed position)
    currentY += 25;
    doc.strokeColor(colors.grayLight).lineWidth(1);
    doc
      .moveTo(leftColX, currentY)
      .lineTo(leftColX + contentWidth - 50, currentY)
      .stroke();

    doc.fillColor(colors.gray).fontSize(8).font("Helvetica");
    doc.text("Thank you for your purchase!", leftColX, currentY + 8);
    doc.text(
      "For any questions about this invoice, please contact:",
      leftColX,
      currentY + 18
    );
    doc.text("info@eventsntickets.com.au", leftColX, currentY + 28, {
      underline: true,
      link: "mailto:info@eventsntickets.com.au",
    });

    doc.end();
  });
};
