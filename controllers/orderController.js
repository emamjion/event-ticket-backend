import OrderModel from "../models/orderModel.js";

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await OrderModel.find({
      userId: userId,
      paymentStatus: "paid",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Oders fetched successfully",
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
      message: error.message,
    });
  }
};

// function to get single order by id
const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await OrderModel.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch order details",
      message: error.message,
    });
  }
};

export { getMyOrders, getSingleOrder };
