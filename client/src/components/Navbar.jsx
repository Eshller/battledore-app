import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useService } from "../ContextAPI/axios";

function Navbar() {
  const Navigate = useNavigate();

  const { logOut } = useService();

  const handleLogout = () => {
    logOut();
    Navigate("/");
  };

  return (
    <div>
      <nav className="h-auto bg-[#7CB6CB] pl-24 pr-5 md:pr-10 py-10 rounded-[107px] flex flex-col items-end justify-between relative top-14 md:top-16 md:text-nowrap">
        <div className="text-white flex flex-col gap-7 lg:gap-36 justify-between h-full">
          <div className="flex flex-col gap-7 text-sm md:text-xl lg:text-2xl">
            <div>
              <NavLink
                to="home"
                className={({ isActive }) =>
                  `${
                    isActive ? "opacity-70" : "opacity-100"
                  } flex gap-3  md:gap-5  items-center cursor-pointer`
                }
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" />
                </svg>{" "}
                <span className="hidden md:block">Home</span>
              </NavLink>
            </div>
            <div>
              <NavLink
                to="accounts"
                className={({ isActive }) =>
                  `${
                    isActive ? "opacity-70" : "opacity-100"
                  } flex gap-3  md:gap-5  items-center cursor-pointer`
                }
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
                </svg>
                <span className="hidden md:block">Accounts</span>
              </NavLink>
            </div>
            <div>
              <NavLink
                to="livescore"
                className={({ isActive }) =>
                  `${
                    isActive ? "opacity-70" : "opacity-100"
                  } flex gap-3  md:gap-5  items-center cursor-pointer`
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="M196-276q-57-60-86.5-133T80-560q0-78 29.5-151T196-844l48 48q-48 48-72 110.5T148-560q0 63 24 125.5T244-324l-48 48Zm96-96q-39-39-59.5-88T212-560q0-51 20.5-100t59.5-88l48 48q-30 27-45 64t-15 76q0 36 15 73t45 67l-48 48ZM280-80l135-405q-16-14-25.5-33t-9.5-42q0-42 29-71t71-29q42 0 71 29t29 71q0 23-9.5 42T545-485L680-80h-80l-26-80H387l-27 80h-80Zm133-160h134l-67-200-67 200Zm255-132-48-48q30-27 45-64t15-76q0-36-15-73t-45-67l48-48q39 39 58 88t22 100q0 51-20.5 100T668-372Zm96 96-48-48q48-48 72-110.5T812-560q0-63-24-125.5T716-796l48-48q57 60 86.5 133T880-560q0 78-28 151t-88 133Z" />
                </svg>
                <span className="hidden md:block">Live scores</span>
              </NavLink>
            </div>
            <div>
              <NavLink
                to="events"
                className={({ isActive }) =>
                  `${
                    isActive ? "opacity-70" : "opacity-100"
                  } flex gap-3  md:gap-5 items-center cursor-pointer`
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="M580-240q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
                </svg>
                <span className="hidden md:block">Events</span>
              </NavLink>
            </div>
            <div>
              <NavLink
                to="pastmatches"
                className={({ isActive }) =>
                  `${
                    isActive ? "opacity-70" : "opacity-100"
                  } flex gap-3 md:gap-5 items-center cursor-pointer`
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z" />
                </svg>
                <span className="hidden md:block">Past matches</span>
              </NavLink>
            </div>
            <div className="border-b-2 text-[#7CB6CB] mb-4"></div>
          </div>
          <div className="flex flex-col gap-7 text-sm md:text-xl lg:text-2xl">
            <div>
              <NavLink
                to="user/setting"
                className={({ isActive }) =>
                  `${
                    isActive ? "opacity-70" : "opacity-100"
                  } flex gap-3 md:gap-5 items-center cursor-pointer`
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#e8eaed"
                >
                  <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                </svg>
                <span className="hidden md:block">Settings</span>
              </NavLink>
            </div>
            <button onClick={handleLogout}>
              <span className="hidden md:block border transition duration-300 ease-out hover:ease-in hover:scale-y-110 text-center rounded-xl py-1 cursor-pointer">
                Logout
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
                className="md:hidden"
              >
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
