import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import io from "socket.io-client";

const socket = io(`${import.meta.env.VITE_SERVER}`);

function liveScore() {
  const { getScoresData, myData, removeMatch, numberofMatches } = useService();

  const Navigate = useNavigate();

  const [liveScore, setLiveScore] = useState("");

  const [list, setList] = useState([]);

  const getData = async () => {
    const res = await getScoresData();
    setList(res?.reverse());
  };
  useEffect(() => {
    getData();
  }, [numberofMatches]);

  useEffect(() => {
    socket.on("score_updated", (data) => {
      setLiveScore(data);
    });

    return () => {
      socket.off("score_updated");
    };
  }, []);

  return (
    <div className="w-[90%] md:w-[95%] h-screen overflow-y-auto">
      <h1 className="text-3xl text-white font-bold mt-20 mb-5 font-inter">
        Live Score
      </h1>
      <hr />
      <div className=" h-[80%] overflow-auto pl-0 md:pl-5">
        {list?.map((event) => (
          <div key={event._id}>
            {event.isPlayed != true && event.scores.length > 0 ? (
              <div className="w-full rounded-3xl bg-[#7CB6CB] mt-5 p-3 font-inter flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div
                  className="flex flex-col lg:flex-row w-[90%] gap-2 cursor-pointer"
                  onClick={() => Navigate(`/matchdetails/${event._id}`)}
                >
                  <img
                    className="rounded-xl w-36"
                    src={`../badminton_court.jpg`}
                    alt=""
                  />
                  <div className="flex flex-col px-1 sm:px-4 gap-2 text-white text-nowrap">
                    <h1 className="text-lg md:text-xl lg:text-2xl font-bold">
                      {event.eventDetails.eventTitle}
                    </h1>
                    <div className="md:flex justify-between items-center gap-10">
                      <div className="text-[1.5rem] md:text-[2rem] xl:text-[2.5rem] flex gap-2">
                        <div className="flex flex-col justify-center items-center">
                          {event.isPlayed || liveScore == ""
                            ? event.scores.length > 0
                              ? event.scores.slice(-1)[0].firstTeamScore
                              : null
                            : liveScore.firstTeamScore}{" "}
                          <span className="text-sm font-normal">
                            ({event.firstTeamName})
                          </span>
                        </div>
                        {" - "}
                        <div className="flex flex-col justify-center items-center">
                          {event.isPlayed || liveScore == ""
                            ? event.scores.length > 0
                              ? event.scores.slice(-1)[0].secondTeamScore
                              : null
                            : liveScore.secondTeamScore}{" "}
                          <span className="text-sm font-normal">
                            ({event.secondTeamName})
                          </span>
                        </div>
                      </div>
                      {event.isPlayed ? (
                        <p className="border border-green-500 px-5 py-1 text-center text-normal md:text-xl bg-green-500 rounded-xl w-48">
                          {event.winner}
                        </p>
                      ) : (
                        <div>
                          {event.scores.length > 0 ? (
                            <div>
                              <div>
                                {liveScore.status === "start" ||
                                liveScore === "" ? (
                                  <div className="w-48 text-center relative bg-red-500 rounded-xl py-1 border-2">
                                    <p className="text-normal md:text-xl font-bold">
                                      Live match
                                    </p>
                                    <span className="absolute -top-[0.3rem] -right-[0.3rem] flex h-4 w-4">
                                      <span className="animate-ping absolute right-0 inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                              <div>
                                {liveScore.status === "end" && (
                                  <p className="border border-green-500 px-5 py-1 text-center text-xl md:text-xl bg-green-500 rounded-xl w-48">
                                    {liveScore.won}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className=" text-end">
                  {myData.isOperator && (
                    <div>
                      <button
                        onClick={() => {
                          removeMatch(event?.eventDetails?._id, event?._id);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#e8eaed"
                          className="w-5 sm:w-7 h-5 sm:h-7"
                        >
                          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            {event.isPlayed != true && event.scores.length == 0 ? (
              <div className="w-full rounded-3xl bg-[#7CB6CB] mt-5 p-3 font-inter flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div
                  className="flex flex-col lg:flex-row w-[90%] gap-2 cursor-pointer"
                  onClick={() => Navigate(`/matchdetails/${event._id}`)}
                >
                  <img
                    className="rounded-xl w-36"
                    src={`../badminton_court.jpg`}
                    alt=""
                  />
                  <div className="flex flex-col px-1 sm:px-4 gap-0 text-white text-nowrap">
                    <h1 className="text-lg md:text-xl lg:text-2xl font-bold">
                      {event.eventDetails.eventTitle}
                    </h1>
                    {event.isPlayed != true && event.scores.length > 0 ? (
                      <div className="md:flex justify-between items-center gap-10">
                        <div className="text-[1.5rem] md:text-[2rem] xl:text-[2.5rem] flex gap-2">
                          <div className="flex flex-col justify-center items-center">
                            {event.isPlayed || liveScore == ""
                              ? event.scores.length > 0
                                ? event.scores.slice(-1)[0].firstTeamScore
                                : null
                              : liveScore.firstTeamScore}{" "}
                            <span className="text-sm font-normal">
                              ({event.firstTeamName})
                            </span>
                          </div>
                          {" - "}
                          <div className="flex flex-col justify-center items-center">
                            {event.isPlayed || liveScore == ""
                              ? event.scores.length > 0
                                ? event.scores.slice(-1)[0].secondTeamScore
                                : null
                              : liveScore.secondTeamScore}{" "}
                            <span className="text-sm font-normal">
                              ({event.secondTeamName})
                            </span>
                          </div>
                        </div>
                        {event.isPlayed ? (
                          <p className="border border-green-500 px-5 py-1 text-center text-normal md:text-xl bg-green-500 rounded-xl w-48">
                            {event.winner}
                          </p>
                        ) : (
                          <div>
                            {event.scores.length > 0 ? (
                              <div>
                                <div>
                                  {liveScore.status === "start" ||
                                  liveScore === "" ? (
                                    <div className="w-48 text-center relative bg-red-500 rounded-xl py-1">
                                      <p className="text-normal md:text-xl font-bold">
                                        Live match
                                      </p>
                                      <span class="absolute top-0 right-0 flex h-3 w-3">
                                        <span class="animate-ping absolute right-0 inline-flex h-full w-full rounded-full bg-red-900 opacity-75"></span>
                                        <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                                <div>
                                  {liveScore.status === "end" && (
                                    <p className="border border-green-500 px-5 py-1 text-center text-xl md:text-xl bg-green-500 rounded-xl w-48">
                                      {liveScore.won}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {event.isPlayed != true && event.scores.length == 0 ? (
                          <div>
                            <p className="text-medium md:text-lg font-semibold">
                              {event.eventDetails.eventStart}
                              {"  "}
                              <span className="font-normal">to</span>
                              {"  "}
                              {event.eventDetails.eventEnd}
                            </p>
                            <p className="font-base">
                              {event.eventDetails.eventDesc}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                <div className=" text-end">
                  {myData.isOperator && (
                    <div>
                      <button
                        onClick={() => {
                          removeMatch(event?.eventDetails?._id, event?._id);
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#e8eaed"
                          className="w-5 sm:w-7 h-5 sm:h-7"
                        >
                          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default liveScore;
