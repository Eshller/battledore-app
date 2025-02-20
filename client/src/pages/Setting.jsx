import React, { useEffect, useState } from "react";
import { useService } from "../ContextAPI/axios";

function Setting() {
  const { myData, updateMyData } = useService();
  const [isEditable, setIsEditable] = useState(false);
  const [updateName, setUpdateName] = useState("");
  const [updateEmail, setUpdateEmail] = useState("");
  const [updateRole, setUpdateRole] = useState("");

  function editMyDetail() {
    updateMyData({
      ...myData,
      username: updateName,
      email: updateEmail,
      jobrole: updateRole,
    });
    setIsEditable(!isEditable);
  }

  function toSentenceCase(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  useEffect(() => {
    if (myData) {
      setUpdateName(toSentenceCase(myData.username) || "");
      setUpdateEmail(myData.email || "");
      setUpdateRole(toSentenceCase(myData.jobrole) || "");
    }
  }, [myData]);

  return (
    <>
      <div className="w-[88%] h-[78vh]">
        {/* h-[87vh] border */}
        <h1 className="text-3xl md:text-4xl text-white font-bold mt-20 mb-5 font-inter">
          Settings
        </h1>
        <hr />
        <div>
          {myData ? (
            <div className="mt-8 flex flex-col md:flex-row md:justify-between items-center gap-2 font-inter">
              <div id="about_setting" className="lg:flex gap-6 w-full h-auto">
                <img
                  className="w-36 rounded-2xl"
                  src="../badminton.jpg"
                  alt=""
                />
                <div className="text-white text-sm sm:text-base md:text-lg h-auto text-nowrap mt-5 flex flex-col gap-2 md:gap-4">
                  <div className="font-light flex gap-1">
                    <span>Name : </span>
                    <input
                      type="text"
                      name="username"
                      value={updateName}
                      onChange={(e) => setUpdateName(e.target.value)}
                      readOnly={!isEditable}
                      className={`font-bold text-[#B1D848] bg-transparent outline-none ${
                        isEditable
                          ? "border border-gray-300 rounded-lg px-2 w-44 sm:w-auto"
                          : "border-transparent"
                      } `}
                    />
                  </div>
                  <div className="font-light flex gap-1">
                    <span>Email : </span>
                    <input
                      type="email"
                      name="email"
                      value={updateEmail}
                      onChange={(e) => setUpdateEmail(e.target.value)}
                      readOnly={!isEditable}
                      className={`font-bold bg-transparent outline-none ${
                        isEditable
                          ? "border border-gray-300 rounded-lg px-2 w-44 sm:w-auto"
                          : "border-transparent"
                      } `}
                    />
                  </div>
                  <div className="font-light flex gap-1">
                    <span>Role : </span>
                    <input
                      type="text"
                      name="jobrole"
                      value={updateRole}
                      onChange={(e) => setUpdateRole(e.target.value)}
                      readOnly={!isEditable}
                      className={`font-bold bg-transparent outline-none  ${
                        isEditable
                          ? "border border-gray-300 rounded-lg px-2 w-44 sm:w-auto"
                          : "border-transparent"
                      } `}
                    />
                  </div>
                </div>
              </div>
              <div className="text-end w-full md:w-auto">
                {isEditable ? (
                  <button
                    onClick={() => {
                      editMyDetail();
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e8eaed"
                      className="outline-none bg-[#7cb6cb] rounded-full p-2 h-10 w-10"
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
                      className="bg-[#7cb6cb] rounded-full p-2 h-10 w-10"
                    >
                      <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p>Loding....</p>
          )}
        </div>
      </div>
    </>
  );
}

export default Setting;
