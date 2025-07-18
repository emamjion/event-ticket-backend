import fs from "fs";
import { DateTime } from "luxon";
import path from "path";
import PDFDocument from "pdfkit";

const generateSerialNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomNum = Math.floor(Math.random() * 900 + 100);
  return `${dateStr}-${randomNum}`;
};

const generateCurrentDate = () => {
  return DateTime.now().setZone("Australia/Sydney").toFormat("dd/MM/yyyy");
};

export const generateInvoicePDF = async (order, event, customer) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

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

    doc.rect(0, 0, pageWidth, pageHeight).fill(colors.grayLight);

    const ticketCount = order?.seats?.length || 0;
    const baseContentHeight = 480;
    const ticketRowHeight = 25;
    const totalContentHeight =
      baseContentHeight + ticketCount * ticketRowHeight;
    const cardHeight = Math.min(totalContentHeight, pageHeight - 40);

    const cardY = 20;
    doc.fillColor(colors.white);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 8).fill();

    const headerHeight = 90;
    doc.fillColor(colors.orange);
    doc.roundedRect(margin, cardY, contentWidth, headerHeight, 8).fill();
    doc.rect(margin, cardY + headerHeight - 8, contentWidth, 8).fill();

    const logoPath = path.resolve("public/events-logo.png");
    const logoWidth = 60;
    const logoHeight = 60;
    const logoX = margin + 30;
    const logoY = cardY + (headerHeight - logoHeight) / 2;

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, logoX, logoY, {
        width: logoWidth,
        height: logoHeight,
      });
    }

    const titleX = logoX + logoWidth + 15;
    const titleY = logoY + 10;

    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(28);
    doc.text("INVOICE", titleX, titleY);

    // Format invoice date safely
    const invoiceDate = order?.date
      ? DateTime.fromJSDate(new Date(order.date))
          .setZone("Australia/Sydney")
          .toFormat("dd/MM/yyyy")
      : generateCurrentDate();

    doc.fontSize(9).font("Helvetica");
    doc.text(
      `Invoice #: ${order.invoiceNumber || generateSerialNumber()}`,
      titleX,
      titleY + 25
    );
    doc.text(`Date: ${invoiceDate}`, titleX, titleY + 38);

    const amountToShow =
      order.finalAmount !== undefined
        ? order.finalAmount
        : order.totalAmount || 0;

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

    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(16);
    doc.text(`$${amountToShow.toFixed(2)}`, totalBoxX + 8, totalBoxY + 25, {
      width: totalBoxWidth - 16,
      align: "center",
    });

    let currentY = cardY + headerHeight + 15;
    const leftColX = margin + 25;
    const rightColX = margin + contentWidth * 0.58;

    doc.fillColor(colors.orange).fontSize(9).font("Helvetica-Bold");
    doc.text("FROM", leftColX, currentY);
    doc.fillColor(colors.black).fontSize(9).font("Helvetica");
    doc.text("EventsNTickets", leftColX, currentY + 12);
    doc.text("38 Liddle Street", leftColX, currentY + 24);
    doc.text("North St Marys", leftColX, currentY + 36);
    doc.text("NSW 2760", leftColX, currentY + 48);
    doc.text("ABN: 48 550 860 418", leftColX, currentY + 60);

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

    doc.fillColor(colors.orange).fontSize(10).font("Helvetica-Bold");
    doc.text("EVENT DETAILS", leftColX, currentY);
    currentY += 15;

    doc.fillColor(colors.grayLight);
    doc.roundedRect(leftColX, currentY, contentWidth - 50, 55, 4).fill();

    doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(12);
    doc.text(event.title || "Event Name", leftColX + 12, currentY + 12);

    // ✅ Format event.date safely with timezone
    let formattedEventDate = "TBD";

    if (event?.date) {
      let parsedDate;
      if (event.date instanceof Date) {
        parsedDate = DateTime.fromJSDate(event.date);
      } else if (
        typeof event.date === "string" &&
        !isNaN(Date.parse(event.date))
      ) {
        parsedDate = DateTime.fromISO(event.date);
      }

      if (parsedDate?.isValid) {
        formattedEventDate = parsedDate
          .setZone("Australia/Sydney")
          .toFormat("dd MMMM yyyy");
      }
    }

    doc.fillColor(colors.gray).fontSize(9).font("Helvetica");
    doc.text(`Date: ${formattedEventDate}`, leftColX + 12, currentY + 28);
    doc.text(
      `Location: ${event.location || "TBD"}`,
      leftColX + 12,
      currentY + 40,
      {
        width: contentWidth - 75,
      }
    );

    currentY += 70;

    doc.fillColor(colors.orange);
    doc.rect(leftColX, currentY, contentWidth - 50, 20).fill();

    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(9);
    doc.text("DESCRIPTION", leftColX + 8, currentY + 6);
    doc.text("PRICE", leftColX + contentWidth - 100, currentY + 6);
    currentY += 20;

    order?.seats?.forEach((ticket, index) => {
      const rowColor = index % 2 === 0 ? colors.white : colors.grayLight;
      doc.fillColor(rowColor);
      doc.rect(leftColX, currentY, contentWidth - 50, 25).fill();

      doc.fillColor(colors.black).font("Helvetica").fontSize(9);
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

    currentY += 15;
    doc.fillColor(colors.gray).font("Helvetica").fontSize(9);
    doc.text("Subtotal", leftColX + contentWidth - 130, currentY);
    doc.text(
      `$${amountToShow.toFixed(2)}`,
      leftColX + contentWidth - 90,
      currentY
    );

    currentY += 15;
    doc.fillColor(colors.orangeLight);
    doc.roundedRect(leftColX + contentWidth - 130, currentY, 100, 22, 4).fill();

    doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(10);
    doc.text("TOTAL", leftColX + contentWidth - 122, currentY + 6);
    doc.text(
      `$${amountToShow.toFixed(2)}`,
      leftColX + contentWidth - 90,
      currentY + 6
    );

    currentY += 35;
    doc.fillColor(colors.gray).font("Helvetica").fontSize(9);
    doc.text("Payment Method:", leftColX, currentY);
    doc.fillColor(colors.black).font("Helvetica-Bold").fontSize(9);
    doc.text("Credit Card", leftColX + 75, currentY);

    currentY += 25;
    doc.strokeColor(colors.grayLight).lineWidth(1);
    doc
      .moveTo(leftColX, currentY)
      .lineTo(leftColX + contentWidth - 50, currentY)
      .stroke();

    doc.fillColor(colors.gray).font("Helvetica").fontSize(8);
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
