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

export { checkAdmin, getPurchasedTickets, makeUserAdmin };
