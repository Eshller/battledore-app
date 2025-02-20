import React, { useState, useEffect } from "react";
import { useService } from "../ContextAPI/axios";
import MatchList from "./MatchList.jsx";
import MatchForm from "./MatchForm.jsx";

function EventList({ event }) {
  const { removeEvent, numberOfEvents, updateEvent, myData } = useService();

  useEffect(() => {
    removeEvent;
  }, [numberOfEvents]);

  const [isEditable, setIsEditable] = useState(false);
  const [showMatchList, setShowMatchList] = useState(false);
  const [updateName, setUpdateName] = useState(event.eventTitle);
  const [updateDesc, setUpdateDesc] = useState(event.eventDesc);
  const [match, setMatch] = useState(false);
  const [clickToDelete, setClickToDelete] = useState(false);

  function scheduleMatch() {
    setMatch(!match);
  }

  function editEventDetail() {
    updateEvent(event._id, {
      ...event,
      eventTitle: updateName,
      eventDesc: updateDesc,
    });
    setIsEditable(!isEditable);
  }

  return (
    <>
      <div className="px-0 md:px-5">
        <div className="mt-3 sm:mt-8 lg:flex justify-between items-center gap-5 lg:gap-12">
          <div
            id="about_event"
            className="sm:flex lg:items-center sm:gap-3 md:gap-6 w-full h-auto"
          >
            <div className="w-36 h-auto">
              <img
                className="w-full h-full rounded-2xl"
                src="../badminton.jpg"
                alt=""
              />
            </div>
            <div className="text-white mt-3 sm:mt-0 w-full">
              <input
                type="text"
                name="eventTitle"
                className={`text-[#B1D848] bg-transparent text-base xs:text-[1.25rem] md:text-xl lg:text-2xl font-bold outline-none w-full ${
                  isEditable
                    ? "border border-gray-300 rounded-lg px-2"
                    : "border-transparent"
                } `}
                value={updateName}
                onChange={(e) => {
                  setUpdateName(e.target.value);
                }}
                readOnly={!isEditable}
              />
              <p className="font-medium text-[0.975rem] md:text-lg">
                {event.eventStart} <span className="font-normal">to</span>{" "}
                {event.eventEnd}
              </p>
              <input
                type="text"
                name="eventDesc"
                className={`outline-none bg-transparent text-[0.8rem] md:text-base w-full h-auto break-keep whitespace-normal border border-gray-400 ${
                  isEditable
                    ? "border border-gray-300 rounded-lg px-2"
                    : "border-transparent"
                } no-scrollbal overscroll-none  resize-none `}
                value={updateDesc}
                onChange={(e) => setUpdateDesc(e.target.value)}
                readOnly={!isEditable}
              />
            </div>
          </div>
          <div
            id="edit"
            className="flex gap-4 cursor-pointer mt-2 justify-end items-center"
          >
            <div
              className="border rounded-full"
              onClick={() => setShowMatchList(!showMatchList)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="30px"
                viewBox="0 -960 960 960"
                width="30px"
                fill="#fff"
              >
                <path d="M480-360 280-560h400L480-360Z" />
              </svg>
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
                    onClick={() => removeEvent(event._id)}
                    className="text-white font-bold rounded-lg bg-red-500 border border-red-500 hover:bg-red-600 hover:border-red-600 px-4 py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
            <div>
              {myData.isOperator && (
                <div className="flex gap-4">
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
                  {isEditable ? (
                    <button
                      onClick={() => {
                        editEventDetail();
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#e8eaed"
                      >
                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditable((prev) => !prev);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#e8eaed"
                      >
                        <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                      </svg>
                    </button>
                  )}

                  <button onClick={scheduleMatch}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e8eaed"
                    >
                      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          {showMatchList && (
            <div>
              {event?.matches?.length > 0 ? (
                <div>
                  {event?.matches?.map((match) => (
                    <div key={match._id}>
                      <MatchList match={match} eventId={event._id} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-white font-inter">
                  No match is created
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div>{match && <MatchForm event={event} />}</div>
    </>
  );
}

export default EventList;
