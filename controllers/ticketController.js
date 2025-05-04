import { v2 as cloudinary } from "cloudinary";
import TicketModel from "../models/ticketModel.js";

// function for get all tickets
const getTickets = async (req, res) => {
  try {
    const tickets = await TicketModel.find({});
    console.log("Tickets: ", tickets);
    res.status(200).json({
      success: true,
      message: "All tickets fetched successfully",
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

// Get Ticket Details by ID
const getTicketById = async (req, res) => {
  try {
    const ticket = await TicketModel.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket fetched successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};

// Create New Ticket
const createTicket = async (req, res) => {
  try {
    console.log("req.body: ", req.body);
    const { title, description, time, location, price, ticketsAvailable } =
      req.body;
    const image = req.file;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }
    const result = await cloudinary.uploader.upload(image.path);
    const imageUrl = result.secure_url;

    const newTicket = new TicketModel({
      title,
      description,
      time,
      location,
      image: imageUrl,
      price: Number(price),
      ticketsAvailable,
    });

    await newTicket.save();

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: newTicket,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create ticket",
      error: error.message,
    });
  }
};

// Update Ticket by ID
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedTicket = await TicketModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update ticket",
      error: error.message,
    });
  }
};

// Delete Ticket by ID
const deleteTicket = async (req, res) => {
  try {
    const deleted = await TicketModel.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
      error: error.message,
    });
  }
};

export { createTicket, deleteTicket, getTicketById, getTickets, updateTicket };
