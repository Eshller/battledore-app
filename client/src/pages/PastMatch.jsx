import React, { useState, useEffect } from "react";
import { useService } from "../ContextAPI/axios";
import { useNavigate } from "react-router-dom";

function PastMatch() {
  const { getScoresData, numberofMatches, myData, removeMatch } = useService();
  const [list, setList] = useState([]);

  const Navigate = useNavigate();

  const getMatch = async () => {
    const res = await getScoresData();
    setList(res?.reverse());
  };

  useEffect(() => {
    getMatch();
  }, [numberofMatches]);

  return (
    <div className="h-screen overflow-y-auto w-[90%]">
      <h1 className="text-3xl text-white font-bold mt-20 mb-5 font-inter">
        Past Matches
      </h1>
      <hr />
      <div className="">
        {list?.map((event) => (
          <div key={event._id}>
            {event.isPlayed ? (
              <div className="w-full rounded-3xl bg-[#7CB6CB] mt-5 p-1 sm:p-3 font-inter flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div
                  className="flex flex-col xs:flex-row gap-2 cursor-pointer w-full"
                  onClick={() => Navigate(`/matchdetails/${event._id}`)}
                >
                  <div className="mx-2 mt-1 sm:mx-0 sm:mt-0 w-24 sm:w-36 flex justify-center items-center">
                    <img
                      className="rounded-lg w-full h-full"
                      src={`../badminton_court.jpg`}
                      alt=""
                    />
                  </div>
                  <div className="flex flex-col px-1 sm:px-4 gap-2 text-white text-wrap">
                    <h1 className="text-lg md:text-xl lg:text-2xl font-bold">
                      {event?.eventDetails?.eventTitle}
                    </h1>
                    <div className="flex justify-evenly items-center gap-4">
                      <div className="text-[1.5rem] md:text-[2rem] xl:text-[2.5rem] flex gap-2">
                        <div className="flex flex-col justify-center items-center">
                          {event.isPlayed
                            ? event?.scores.slice(-1)[0]?.firstTeamScore
                            : null}
                          <span className="text-sm font-normal">
                            ({event?.firstTeamName})
                          </span>
                        </div>
                        {" - "}
                        <div className="flex flex-col justify-center items-center">
                          {event.isPlayed
                            ? event?.scores.slice(-1)[0]?.secondTeamScore
                            : null}
                          <span className="text-sm font-normal">
                            ({event?.secondTeamName})
                          </span>
                        </div>
                      </div>

                      <p className="border border-green-500 px-2 sm:px-4 py-1 text-center text-normal md:text-xl bg-green-500 rounded-lg sm:rounded-xl w-auto sm:w-[48] text-wrap">
                        {event?.winner}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
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
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PastMatch;
