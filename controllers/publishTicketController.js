import TicketModel from "../models/ticketModel.js";

// publish ticket
const publishTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const updatedTicket = await TicketModel.findByIdAndUpdate(
      id,
      { isPublished },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Ticket has been ${isPublished ? "published" : "unpublished"}`,
      data: updatedTicket,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update ticket status",
      error: error.message,
    });
  }
};

// get publish ticket
const getPublishedTickets = async (req, res) => {
  try {
    const tickets = await TicketModel.find({ isPublished: true }).sort({
      date: 1,
    });

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get published tickets",
      error: error.message,
    });
  }
};

// get published ticket by Id for details
const getPublishedTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await TicketModel.findById(id);

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get ticket",
      error: error.message,
    });
  }
};

export { getPublishedTicketById, getPublishedTickets, publishTicket };
