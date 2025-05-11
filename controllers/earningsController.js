import OrderModel from "../models/orderModel.js";

const getSellerEarnings = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const orders = await OrderModel.find()
      .populate({
        path: "ticketId",
        match: { sellerId },
        select: "price quantity",
      })
      .exec();

    const filteredOrders = orders.filter((order) => order.ticketId);

    const totalEarnings = filteredOrders.reduce((acc, order) => {
      return acc + order.ticketId.price * order.quantity;
    }, 0);

    res.status(200).json({
      success: true,
      message: "Seller earnings fetched successfully",
      totalEarnings,
      totalOrders: filteredOrders.length,
      orders: filteredOrders,
    });
  } catch (error) {
    console.error("Error getting seller earnings:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

export { getSellerEarnings };
