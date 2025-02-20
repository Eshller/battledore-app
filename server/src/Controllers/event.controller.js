import { Event } from "../Models/event.model.js";
import { Match } from "../Models/matchs.model.js";

const getAllEvents = async (req, res) => {
  try {
    const event = await Event.find().populate("matches");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({ events: event });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const setEvent = async (req, res) => {
  try {
    const { eventTitle, eventStart, eventEnd, eventDesc } = req.body;
    if (
      [eventTitle, eventStart, eventEnd, eventDesc].some(
        (field) => field?.trim() === ""
      )
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const event = await Event.create({
      eventTitle,
      eventStart,
      eventEnd,
      eventDesc,
    });

    const createdEvent = await Event.findById(event._id);
    if (!createdEvent) {
      return res
        .status(500)
        .json({ message: "Something went wrong while registering the event" });
    }

    return res
      .status(201)
      .json({ data: createdEvent, message: "Event is scheduled successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const existingEvent = await Event.findById({ _id: eventId });
  if (!existingEvent) {
    return res.status(404).json({ message: "Event not found" });
  }
  const updatedEvent = await Event.findByIdAndUpdate(eventId, req.body, {
    new: true,
  });

  if (!updatedEvent) {
    return res
      .status(500)
      .json({ message: "Something went wrong while updating the event" });
  }

  return res
    .status(200)
    .json({ data: updatedEvent, message: "Event is updated successfully" });
};

const deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  const existingEvent = await Event.findById({ _id: eventId });
  if (!existingEvent) {
    return res.status(404).json({ message: "Event not found" });
  }

  await Match.deleteMany({ _id: { $in: existingEvent.matches } });

  await Event.deleteOne({ _id: eventId });

  return res.status(200).json({ message: "Event is deleted successfully" });
};

export { getAllEvents, setEvent, updateEvent, deleteEvent };
