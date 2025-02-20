import { useService } from "../ContextAPI/axios.jsx";
import React from "react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import io from "socket.io-client";
import Watermark from "../components/Watermark.jsx";

const socket = io(`${import.meta.env.VITE_SERVER}`);

function Home() {
  const { myData, getEvents, getScoresData } = useService();

  const [liveScore, setLiveScore] = useState("");
  const [events, setEvents] = useState([]);
  const [score, setScore] = useState([]);

  const getData = async () => {
    const eve = await getEvents();
    setEvents(eve);
    const res = await getScoresData();
    setScore(res);
  };

  dayjs.extend(customParseFormat);
  const startDate = dayjs().subtract(30, "day");
  const endDate = dayjs().add(30, "day");
  const recentEvents = events?.filter((event) => {
    const eventStartDate = dayjs(event.eventStart, "DD-MM-YYYY");
    const eventEndDate = dayjs(event.eventEnd, "DD-MM-YYYY");

    return (
      eventStartDate.isBetween(startDate, endDate, null, "[]") ||
      eventEndDate.isBetween(startDate, endDate, null, "[]")
    );
  });

  function toSentenceCase(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  const lastThreeEvents = recentEvents?.length - 3;

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    socket.on("score_updated", (data) => {
      setLiveScore(data);
    });

    return () => {
      socket.off("score_updated");
    };
  }, []);

  return (
    <div className="md:px-10 lg:px-0 min-h-[95vh]">
      <h3 className="mt-10 text-xl sm:text-4xl text-white mb-3 flex gap-2 font-inter">
        Hello,
        <span className="text-[#B1D848] font-bold">
          {toSentenceCase(myData.username)}
        </span>
      </h3>
      <p className="border-b-2 w-1/2"></p>
      <div className="flex flex-col gap-10 py-10">
        {/* Event Section */}
        <div className=" border-4 border-[#7CB6CB] w-[98%] xs:w-[85%] sm:w-[80%] min-h-[200px] sm:min-h-[400px] rounded-[30px] md:rounded-[60px] lg:rounded-[75px]  flex justify-between flex-col xl:flex-row gap-1 xs:gap-0 ">
          <div className="w-auto xl:w-[80%] p-2 md:p-4 lg:p-7 py-2">
            <h1
              className="text-xl xs:text-2xl md:text-3xl lg:text-[2rem] px-0 md:px-3 py-2
             font-bold text-white"
            >
              Events
            </h1>
            <div className="text-white px-2 mt-5">
              {recentEvents?.slice(lastThreeEvents)?.map((event) => (
                <div
                  key={event._id}
                  className="lg:flex md:gap-5 lg:gap-10 mt-3 items-center"
                >
                  <div className="w-24 md:w-28">
                    <img
                      src="./badminton.jpg"
                      alt="images"
                      className="h-auto w-full rounded-xl"
                    />
                  </div>
                  <div className="leading-4 md:leading-5 lg:leading-8">
                    <h1 className="text-sm xs:text-lg md:text-xl text-[#B1D848] font-bold">{`${event.eventTitle}`}</h1>
                    <p className="font-medium text-sm xs:text-base sm:text-lg">
                      {`${event.eventStart}`}
                      <span className="font-normal"> to </span>
                      {`${event.eventEnd}`}
                    </p>
                    <p className="text-sm sm:text-base md:text-lg">{`${event.eventDesc}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="h-auto w-full xl:w-[40%] p-0 xl:py-0 flex items-center rounded-[4rem] bg-[#7CB6CB] shadow-2xl">
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `${isActive ? "opacity-70" : "opacity-100"
                } items-center cursor-pointer border py-3 w-full font-medium rounded-3xl text-base  md:text-xl scale-95 hover:scale-100 bg-white text-center shadow-2xl`
              }
            >
              See All
            </NavLink>
          </div>
        </div>

        {/* Live Score Section */}
        <div className="border-4 border-[#7CB6CB] w-[98%] xs:w-[85%] sm:w-[80%] min-h-[200px] sm:min-h-[350px] rounded-[30px] md:rounded-[60px] lg:rounded-[75px] flex justify-between flex-col xl:flex-row gap-1 xs:gap-0">
          <div className="w-auto xl:w-[80%] rounded-3xl xl:rounded-[50px] bg-[#7CB6CB] overflow-hidden shadow-2xl min-h-[500px]">
            <h1 className="text-xl xs:text-2xl md:text-3xl font-bold text-white px-5 sm:px-10 md:px-16 py-5">
              Live Score
            </h1>
            <div className="w-[104%] relative -left-2 h-64 bg-[url(.././badminton.jpg)] bg-center bg-cover bg-no-repeat"></div>
            <div className="text-white p-2 md:p-8">
              {score?.map((isLive) => (
                <div key={isLive._id}>
                  {isLive.isPlayed != true && isLive.scores.length > 0 ? (
                    <div className="flex flex-col gap-0 md:gap-2 items-center">
                      <h1 className="text-lg md:text-xl xl:text-2xl font-bold text-[#B1D848]">
                        {isLive.eventDetails.eventTitle}
                      </h1>
                      <h3 className="text-lg md:text-xl font-semibold">
                        {isLive.eventDetails.eventStart}
                        <span className="font-medium"> to </span>
                        {isLive.eventDetails.eventEnd}
                      </h3>
                      <p className="text-base md:text-lg">
                        {isLive.eventDetails.eventDesc}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="h-auto w-full xl:w-[40%] xs:px-5 xs:py-3 xl:py-0 flex items-center">
            <NavLink
              to="/liveScore"
              className={({ isActive }) =>
                `${isActive ? "opacity-70" : "opacity-100"
                } items-center cursor-pointer border py-3 w-full font-medium rounded-3xl text-base  md:text-xl scale-95 hover:scale-100 bg-white text-center shadow-2xl`
              }
            >
              See All
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
