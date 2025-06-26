import PDFDocument from "pdfkit";

const generateTicketPDF = (booking) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    doc.fontSize(20).text("Event Ticket", { align: "center" });
    doc.moveDown();
    doc.text(`Event ID: ${booking.eventId}`);
    doc.text(`Booking ID: ${booking._id}`);
    doc.text(`Quantity: ${booking.quantity || 1}`);
    doc.text(`Note: ${booking.note || "No note added"}`);
    doc.end();
  });
};

export default generateTicketPDF;
