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

/* with email 

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

    if (booking.recipientEmail) {
      const pdfBuffer = await generateTicketPDF(booking);
      await sendTicketEmail({
        to: booking.recipientEmail,
        subject: "You've received an event ticket",
        note: booking.note,
        pdfBuffer,
        filename: `ticket-${booking._id}.pdf`,
      });
    }

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

    // mail functionality
    const mailOpytions = {
      from: process.env.SENDER_EMAIL,
      to: req.user.email,
      subject: "Your Event Ticket Confirmation",
      html: `
        <h1>Dear, ${req.user.name}</h1>
        <p>This is your ticket</p>
        Testing Ticket -  123456
      `,
    };
    await transporter.sendMail(mailOpytions);

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

/* with full email functionality

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

    if (booking.recipientEmail) {
      const pdfBuffer = await generateTicketPDF(booking);
      await sendTicketEmail({
        to: booking.recipientEmail,
        subject: "You've received an event ticket",
        note: booking.note,
        pdfBuffer,
        filename: `ticket-${booking._id}.pdf`,
      });
    }

    const existingOrder = await OrderModel.findOne({ bookingId: booking._id });
    if (existingOrder) {
      return res
        .status(400)
        .json({ success: false, message: "Order already exists." });
    }

    const event = await EventModel.findById(booking.eventId);
    const buyer = await UserModel.findById(booking.buyerId);
    const seller = event?.sellerId
      ? await SellerModel.findById(event.sellerId)
      : null;

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

    const { filePath, fileName } = await generateInvoicePDFToFile(
      newOrder,
      buyer,
      event
    );

    await sendEmailWithAttachmentFile({
      to: buyer.email,
      subject: "Your Event Invoice & Ticket",
      text: `Hi ${buyer.name},\n\nThank you for your booking. Please find your invoice attached.`,
      filePath,
      filename: fileName,
    });

    if (seller?.email) {
      await sendEmailWithAttachmentFile({
        to: seller.email,
        subject: `Ticket Sold for ${event.title}`,
        text: `Hi ${
          seller.name || "Organizer"
        },\n\nA ticket has been purchased for your event. Invoice attached.`,
        filePath,
        filename: fileName,
      });
    }

    // mail functionality
    // const mailOpytions = {
    //   from: process.env.SENDER_EMAIL,
    //   to: req.user.email,
    //   subject: "Your Event Ticket Confirmation",
    //   html: `
    //     <h1>Dear, ${req.user.name}</h1>
    //     <p>This is your ticket</p>
    //     Testing Ticket -  123456
    //   `,
    // };
    // await transporter.sendMail(mailOpytions);

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

// zsb8qR9UsGl9LQz0
// eventsntickets2017
