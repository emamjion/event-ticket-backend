import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export const generateInvoicePDFToFile = async (order, buyer, event) => {
  return new Promise((resolve, reject) => {
    const fileName = `invoice-${order._id}.pdf`;
    const filePath = path.join("temp", fileName);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text("🎟️ Event Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Buyer: ${buyer.name} (${buyer.email})`);
    doc.text(`Event: ${event.title}`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Amount Paid: $${order.totalAmount}`);
    doc.moveDown();

    doc.text("Seats:");
    order.seats.forEach((s, i) => {
      doc.text(
        `${i + 1}. Section: ${s.section}, Row: ${s.row}, Seat: ${s.seatNumber}`
      );
    });

    doc.end();

    stream.on("finish", () => resolve({ filePath, fileName }));
    stream.on("error", reject);
  });
};
