import EventModel from "../models/eventModel.js";

const lockSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedSeats } = req.body;

    const event = await EventModel.findById(id);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const updatedSeats = event.seats.map((seat) => {
      if (selectedSeats.includes(seat.seatNumber)) {
        if (seat.isBooked || seat.isLocked) {
          throw new Error(`Seat ${seat.seatNumber} is already taken`);
        }
        seat.isLocked = true;
      }
      return seat;
    });

    event.seats = updatedSeats;
    await event.save();

    res.status(200).json({
      success: true,
      message: "Seats locked successfully",
      lockedSeats: selectedSeats,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export { lockSeats };
