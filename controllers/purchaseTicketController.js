import bcrypt from "bcryptjs";
import TicketModel from "../models/ticketModel.js";
import UserModel from "../models/userModel.js";
import { createToken } from "../utils/jwtToken.js";

// guerst purchase ticket
const guestPurchaseTicket = async (req, res) => {
  try {
    const { name, email, password, ticketId } = req.body;

    // Check if the ticket exists
    const ticket = await TicketModel.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: "Ticket not found" });
    }

    // Check if user already exists
    let user = await UserModel.findOne({ email });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        role: "buyer",
        purchasedTickets: [
          {
            ticketId: ticket._id,
            name: ticket.name,
            price: ticket.price,
            date: ticket.date,
          },
        ],
      });
    } else {
      // If user exists, add ticket and update role if needed
      user.purchasedTickets.push({
        ticketId: ticket._id,
        name: ticket.name,
        price: ticket.price,
        date: ticket.date,
      });
      if (user.role !== "buyer") {
        user.role = "buyer";
      }
      await user.save();
    }

    // Create JWT token
    const token = createToken({
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    res.status(201).json({
      success: true,
      message: "User created / updated and ticket purchased",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        purchasedTickets: user.purchasedTickets,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// function for get purchased ticket details
const getPurchasedTicketDetails = async (req, res) => {
  try {
    const id = req.params.id;

    const user = await UserModel.findById(id).populate({
      path: "purchasedTickets.ticketId",
      model: "Ticket",
      select: "title date time location price",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Purchased ticket details fetched successfully",
      tickets: user.purchasedTickets,
    });
  } catch (error) {
    console.error("Error fetching ticket details:", error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export { getPurchasedTicketDetails, guestPurchaseTicket };
