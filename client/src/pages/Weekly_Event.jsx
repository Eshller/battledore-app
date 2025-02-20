import React, { useEffect } from "react";
import { useService } from "../ContextAPI/axios";
import EventList from "../components/EventList";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";

function Weekly_Event() {
  const { getEvents, eventList, numberOfEvents, numberofMatches } =
    useService();
  dayjs.extend(isSameOrBefore);
  dayjs.extend(isSameOrAfter);
  dayjs.extend(customParseFormat);

  const thisWeekEvents = eventList?.filter((event) => {
    const eventStartDate = dayjs(event.eventStart, "DD-MM-YYYY");
    const startOfWeek = dayjs().startOf("week");
    const endOfWeek = dayjs().endOf("week");

    return (
      eventStartDate.isSameOrAfter(startOfWeek) &&
      eventStartDate.isSameOrBefore(endOfWeek)
    );
  });

  useEffect(() => {
    getEvents();
  }, [numberOfEvents, numberofMatches]);

  return (
    <>
      {thisWeekEvents?.map((event) => (
        <div key={event._id}>
          <EventList event={event} option={true} />
        </div>
      ))}
    </>
  );
}

export default Weekly_Event;
