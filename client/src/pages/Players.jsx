import React, { useEffect } from "react";
import { useService } from "../ContextAPI/axios";

function Players() {
  const { playerList, getAllUsers, numberOfUsers, myData, removeUser } =
    useService();

  useEffect(() => {
    getAllUsers();
  }, [numberOfUsers]);

  function toSentenceCase(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return (
    <div className="relative h-screen">
      <h1 className="text-3xl text-white font-bold mt-20 mb-5 font-inter">
        Players
      </h1>
      <hr />
      <div>
        <p className="px-4 md:px-10 py-2 text-xl text-white font-medium font-inter">
          Total Players : {playerList.length}
        </p>
        <div className="h-full overflow-y-auto px-4 md:px-0">
          {playerList.map((player) => (
            <div
              key={player._id}
              className="mt-4 md:mt-8 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-12 text-base md:text-lg font-inter"
            >
              <div
                id="about_event"
                className="flex flex-col sm:flex-row gap-2 sm:gap-6 w-full h-auto"
              >
                <img
                  className="w-24 rounded-2xl"
                  src="../badminton.jpg"
                  alt=""
                />
                <div className="text-white w-full h-auto flex flex-col justify-center text-sm sm:text-base md:text-lg lg:text-xl">
                  <p className="font-light">
                    Name :{" "}
                    <span className="text-[#B1D848] font-bold lg:text-xl">
                      {toSentenceCase(player.username)}
                    </span>
                  </p>
                  <p className="font-light text-nowrap">
                    Email : <span className="font-bold">{player.email}</span>
                  </p>
                  {myData.isOperator && (
                    <p className="font-light">
                      Role :{" "}
                      <span className="font-bold">
                        {toSentenceCase(player.jobrole)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              {myData._id === player._id ? null : (
                <div className="text-end w-full sm:w-auto">
                  {myData.isOperator && (
                    <button
                      onClick={() => removeUser(player._id)}
                      className="mr-5"
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
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Players;
