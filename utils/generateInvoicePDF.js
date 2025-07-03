import PDFDocument from "pdfkit";

export const generateInvoicePDF = async (order, buyer, event) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // 🎫 Header
    doc.fontSize(20).text("🎟️ Event Ticket Invoice", { align: "center" });
    doc.moveDown();

    // 👤 Buyer Info
    doc.fontSize(14).text(`Buyer: ${buyer.name} (${buyer.email})`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();

    // 📅 Event Info
    doc.fontSize(14).text(`Event: ${event.title}`);
    doc.text(`Date: ${new Date(event.date).toDateString()}`);
    doc.text(`Location: ${event.location}`);
    doc.moveDown();

    // 💺 Seat Info
    doc.text("Seats:");
    order.seats.forEach((seat, index) => {
      doc.text(
        `  ${index + 1}. Section: ${seat.section}, Row: ${seat.row}, Seat: ${
          seat.seatNumber
        }`
      );
    });

    doc.moveDown();
    doc.text(`Total Paid: $${order.totalAmount}`, { bold: true });

    doc.end();
  });
};
