import UserModel from "../models/userModel.js";

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    res.status(200).json({
      success: true,
      message: "All users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

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

export { checkAdmin, deleteUser, getAllUsers, makeUserAdmin };
