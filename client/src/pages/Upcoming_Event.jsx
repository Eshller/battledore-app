import React, { useEffect } from "react";
import { useService } from "../ContextAPI/axios";
import EventList from "../components/EventList";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";

function Upcoming_Event() {
  const { getEvents, eventList, numberOfEvents, numberofMatches } =
    useService();
  dayjs.extend(isSameOrBefore);
  dayjs.extend(isSameOrAfter);
  dayjs.extend(customParseFormat);

  const upcomingEvents = eventList?.filter((event) => {
    const eventStartDate = dayjs(event.eventStart, "DD-MM-YYYY");
    const eventEndDate = dayjs(event.eventEnd, "DD-MM-YYYY");
    const startOfNextWeek = dayjs().endOf("week").add(1, "day");
    return (
      eventEndDate.isSameOrAfter(dayjs()) &&
      eventStartDate.isAfter(startOfNextWeek)
    );
  });

  useEffect(() => {
    getEvents();
  }, [numberOfEvents, numberofMatches]);

  return (
    <>
      {upcomingEvents?.map((event) => (
        <div key={event._id}>
          <EventList event={event} option={true} />
        </div>
      ))}
    </>
  );
}

export default Upcoming_Event;
