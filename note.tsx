/*


const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res
        .status(400)
        .json({ success: false, message: "paymentIntentId is required." });
    }

    const booking = await BookingModel.findOne({ paymentIntentId });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    if (booking.isPaid) {
      return res
        .status(400)
        .json({ success: false, message: "Payment already confirmed." });
    }

    booking.isPaid = true;
    booking.status = "success";
    booking.isUserVisible = true;
    await booking.save();

    const existingOrder = await OrderModel.findOne({ bookingId: booking._id });
    if (existingOrder) {
      return res
        .status(400)
        .json({ success: false, message: "Order already exists." });
    }

    const event = await EventModel.findById(booking.eventId);

    const newOrder = new OrderModel({
      bookingId: booking._id,
      buyerId: booking.buyerId,
      eventId: booking.eventId,
      seats: booking.seats,
      totalAmount: booking.totalAmount,
      paymentStatus: "success",
      paymentIntentId: booking.paymentIntentId,
      sellerId: event?.sellerId || null,
      quantity: booking.seats.length,
      isUserVisible: true,
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      message: "Payment confirmed and order created.",
      orderId: newOrder._id,
      order: newOrder,
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};


*/
