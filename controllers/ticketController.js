import TicketModel from "../models/ticketModel.js";

const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      image,
      price,
      ticketsAvailable,
      sections,
    } = req.body;

    if (
      !title ||
      !description ||
      !date ||
      !time ||
      !location ||
      !image ||
      !price ||
      !ticketsAvailable
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    if (sections && !Array.isArray(sections)) {
      return res
        .status(400)
        .json({ message: "Sections must be an array if provided." });
    }

    const sellerId = req.user?.id || req.seller?._id;

    if (!sellerId) {
      return res.status(401).json({ message: "Unauthorized seller." });
    }

    const existingTicket = await TicketModel.findOne({
      sellerId,
      title: title.trim(),
      date,
      time,
      location: location.trim(),
    });

    if (existingTicket) {
      return res.status(400).json({
        message: "You have already created a ticket with the same details.",
      });
    }

    const newTicket = new TicketModel({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      location: location.trim(),
      image: image.trim(),
      price: price.toString().trim(),
      ticketsAvailable,
      sellerId,
      sections,
    });

    const savedTicket = await newTicket.save();

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: savedTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res
      .status(500)
      .json({ message: "Server error while creating the ticket." });
  }
};

export { createTicket };
