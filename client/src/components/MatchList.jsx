import React, { useState } from "react";
import dayjs from "dayjs";
import { useService } from "../ContextAPI/axios";
import { useNavigate } from "react-router-dom";

function MatchList({ match, eventId }) {
  const { myData, removeMatch } = useService();
  const Navigate = useNavigate();

  const [clickToDelete, setClickToDelete] = useState(false);

  const today = dayjs().format("DD-MM-YYYY");

  function startGame() {
    Navigate(`/umpire/${match._id}`, { state: { match } });
  }

  function toSentenceCase(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return (
    <>
      <div className="rounded-2xl px-3 py-1 md:p-4 my-4 text-base md:text-lg bg-[#7cb6cb] text-white font-inter font-medium flex justify-between items-center">
        <div className="lg:flex gap-5">
          <h1>{match?.typeOfMatch}</h1>
          <p>{`${match?.firstTeamName} vs ${match?.secondTeamName}`}</p>
          <p>{match?.matchDate}</p>
          <p>{toSentenceCase(match?.referee)}</p>
        </div>
        <div className="flex gap-4">
          <div>
            {match?.isPlayed == false ? (
              <div>
                {myData?.isUmpire || myData?.isOperator ? (
                  <div>
                    {today === match?.matchDate && (
                      <button
                        onClick={startGame}
                        className="border-2 rounded-xl py-1 px-5 bg-green-500 text-white font-inter font-bold"
                      >
                        Start
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl py-1 px-5 bg-green-500 text-white font-inter font-bold">
                {" "}
                {match?.winner}
              </div>
            )}
          </div>

          {clickToDelete && (
            <div className="absolute top-[30%] left-[10%] sm:left-[30%] lg:left-[40%] bg-white p-4 rounded-xl font-inter">
              <h1 className="text-black text-xl text-center font-semibold">
                Are you sure?
              </h1>
              <div className="mt-2 space-x-4">
                <button
                  onClick={() => setClickToDelete(false)}
                  className="border border-gray-800 px-4 py-2 text-black rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeMatch(eventId, match._id)}
                  className="text-white font-bold rounded-lg bg-red-500 border border-red-500 hover:bg-red-600 hover:border-red-600 px-4 py-2"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {myData.isOperator && (
            <button
              onClick={() => {
                setClickToDelete(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
              >
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default MatchList;
