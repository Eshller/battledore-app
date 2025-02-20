import React, { useEffect } from "react";
import EventList from "../components/EventList";
import { useService } from "../ContextAPI/axios";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

function Recent_Event() {
  const { getEvents, eventList, numberOfEvents, numberofMatches } =
    useService();

  dayjs.extend(customParseFormat);
  const startDate = dayjs().subtract(30, "day");
  const endDate = dayjs().add(30, "day");
  const recentEvents = eventList?.filter((event) => {
    const eventStartDate = dayjs(event.eventStart, "DD-MM-YYYY");
    const eventEndDate = dayjs(event.eventEnd, "DD-MM-YYYY");

    return (
      eventStartDate.isBetween(startDate, endDate, null, "[]") ||
      eventEndDate.isBetween(startDate, endDate, null, "[]")
    );
  });

  useEffect(() => {
    getEvents();
  }, [numberOfEvents, numberofMatches]);

  return (
    <>
      {recentEvents?.map((event) => (
        <div key={event._id}>
          <EventList event={event} option={true} />
        </div>
      ))}
    </>
  );
}

export default Recent_Event;
