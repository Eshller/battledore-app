import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import Footer from "../components/Footer";

function ForgotPassword() {
  const Navigate = useNavigate();
  const { forgotPassword, createNewPassword } = useService();
  const [to, setTo] = useState("");
  const [otp, setOTP] = useState(null);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pass, setPass] = useState(false);

  const handleClick = async () => {
    const res = await forgotPassword({ to });
    setOTP(res);
  };

  const handleVerify = async () => {
    if (otp === code) setPass(true);
    setCode("");
  };

  const handlePassword = async () => {
    const res = await createNewPassword({ email: to, password: newPassword });
    if (res.status >= 200 && res.status < 300) {
      setNewPassword("");
      setPass(false);
      setOTP("");
      setTo("");
      Navigate("/login");
    }
  };

  return (
    <>
      <div>
        <div className="h-screen bg-[url('./badminton.jpg')] bg-bottom bg-cover bg-no-repeat">
          <div className="absolute top-[4rem] left-[6rem]">
            <button onClick={() => Navigate("/login")}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
              >
                <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
              </svg>
            </button>
          </div>
          <div className="w-[80%] lg:w-[44rem] left-4 md:left-10 lg:left-24 relative top-[10rem] bg-[#5ea0b8] rounded-[50px] md:rounded-[80px] p-[2rem] md:p-[4rem]">
            <div className="flex flex-col justify-between min-h-[300px]">
              <div>
                <h1 className="text-4xl text-white font-bold font-inter">
                  FORGOT<span className="text-[#B1D848]"> Password !</span>{" "}
                </h1>
              </div>
              <div className="flex flex-col justify-between gap-7 font-inter">
                <div className="flex border-b-2 pb-1 text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e8eaed"
                  >
                    <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" />
                  </svg>
                  <input
                    type="text"
                    name="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="Email"
                    className="bg-transparent outline-none border-none px-6 w-3/4 placeholder:text-white"
                  />
                </div>
                <div
                  className={`flex  border-b-2 pb-1 text-white ${
                    otp ? "" : "hidden"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#e8eaed"
                  >
                    <path d="m438-338 226-226-57-57-169 169-84-84-57 57 141 141Zm42 258q-139-35-229.5-159.5T160-516v-244l320-120 320 120v244q0 152-90.5 276.5T480-80Zm0-84q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z" />
                  </svg>
                  <input
                    type="text"
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="OTP"
                    className="bg-transparent outline-none border-none px-6 w-3/4 placeholder:text-white"
                  />
                </div>
                {pass && (
                  <div className={`flex  border-b-2 pb-1 text-white`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#e8eaed"
                    >
                      <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password"
                      className="bg-transparent outline-none border-none px-6 placeholder:text-white w-full"
                    />
                    <button onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#e8eaed"
                        >
                          <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#e8eaed"
                        >
                          <path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div>
                {otp ? (
                  <div>
                    {pass ? (
                      <button
                        onClick={handlePassword}
                        className="py-2 w-full bg-white font-medium font-inter rounded-3xl text-xl scale-95 hover:scale-100"
                      >
                        Change Password
                      </button>
                    ) : (
                      <button
                        onClick={handleVerify}
                        className="py-2 w-full bg-white font-medium font-inter rounded-3xl text-xl scale-95 hover:scale-100"
                      >
                        Verify OTP
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleClick}
                    className="py-2 w-full bg-white font-medium font-inter rounded-3xl text-xl scale-95 hover:scale-100"
                  >
                    Send OTP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ForgotPassword;
