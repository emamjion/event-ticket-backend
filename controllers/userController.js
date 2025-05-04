import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import UserModel from "../models/userModel.js";

// Make User to Admin
const makeUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        $set: { role: "admin" },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated to Admin successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

// function for check admin
const checkAdmin = async (req, res) => {
  const email = req.params.email;

  // Matching token email with requested email
  if (email !== req.user.email) {
    return res.status(403).json({ message: "Forbidden access" });
  }

  try {
    const user = await UserModel.findOne({ email });

    let admin = false;
    if (user) {
      admin = user.role === "admin";
    }

    res.status(200).json({ admin });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check admin status",
      error: error.message,
    });
  }
};

// function for get purchased ticket
const getPurchasedTickets = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await UserModel.findById(id).populate(
      "purchasedTickets.ticketId"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      purchasedTickets: user.purchasedTickets,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Download pdf
const downloadTickets = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await UserModel.findById(id).populate(
      "purchasedTickets.ticketId"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.purchasedTickets || user.purchasedTickets.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No tickets found" });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=tickets.pdf");

    doc.pipe(res);

    // Header: Logo-style text + Tagline
    doc
      .fontSize(26)
      .fillColor("#cc3333")
      .font("Helvetica-Bold")
      .text("Bitewave Events", { align: "center" });

    doc
      .fontSize(12)
      .fillColor("#555")
      .font("Helvetica")
      .text("Order food and tickets faster with our user-friendly website.", {
        align: "center",
      });

    doc.moveDown(2);

    // User Info
    doc
      .fontSize(14)
      .fillColor("#000")
      .text(`Name: ${user.name || "N/A"}`)
      .text(`Email: ${user.email || "N/A"}`)
      .moveDown();

    // Tickets Section
    for (let i = 0; i < user.purchasedTickets.length; i++) {
      const ticket = user.purchasedTickets[i].ticketId;
      const purchase = user.purchasedTickets[i];

      doc
        .fontSize(16)
        .fillColor("#000")
        .font("Helvetica-Bold")
        .text(`Ticket #${i + 1}`, { underline: true });

      doc
        .fontSize(12)
        .fillColor("#333")
        .font("Helvetica")
        .text(`Event: ${ticket?.title || "N/A"}`, { continued: true })
        .text(`   |   Price: ${purchase.price || "N/A"} BDT`, {
          continued: true,
        })
        .text(
          `   |   Date: ${
            purchase.date ? new Date(purchase.date).toDateString() : "N/A"
          }`
        );

      // QR Code
      const qrText = `Ticket ID: ${ticket?._id || "N/A"} | Event: ${
        ticket?.title || ""
      }`;
      const qrImage = await QRCode.toDataURL(qrText);

      doc.image(qrImage, {
        fit: [100, 100],
        align: "left",
        valign: "center",
      });

      doc
        .moveTo(50, doc.y + 10)
        .lineTo(550, doc.y + 10)
        .strokeColor("#aaaaaa")
        .stroke();

      doc.moveDown(2);
    }

    // Footer
    doc
      .moveDown(2)
      .fontSize(14)
      .fillColor("#007BFF")
      .font("Helvetica-Oblique")
      .text("Thank you for purchasing from Bitewave!", { align: "center" });

    doc.end();
  } catch (error) {
    console.error("PDF error:", error.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
export { checkAdmin, downloadTickets, getPurchasedTickets, makeUserAdmin };
