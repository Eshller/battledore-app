import React from "react";
import { useNavigate } from "react-router-dom";

function Welcome() {
  const Navigate = useNavigate();
  return (
    <>
      <div className="h-screen bg-[url('./badminton.jpg')] bg-bottom bg-cover bg-no-repeat relative">
        <h1 className="text-[3em] sm:text-[4em] md:text-[7em] lg:text-[10em] xl:text-[12em] 2xl:text-[14em] absolute top-[7rem] sm:top-[10rem] md:top-1/4 lg:top-16 z-50 text-white font-bold opacity-80">
          <span className="text-[#B1D848] font-inter font-bold">BATTLE</span>
          DORE
        </h1>
        <div className="w-[90%] sm:w-[60%] md:w-[60%] lg:w-[45%] xl:w-[730px] left-4 md:left-10 lg:left-24 relative top-[7rem] sm:top-[11rem] md:top-[15rem] lg:top-[8rem] bg-[#5ea0b8] min-h-[300px] rounded-[50px] md:rounded-[80px] px-5 md:px-10 pt-10 md:pt-24 lg:pt-[8rem] xl:pt-[10rem] 2xl:pt-[12rem] pb-10">
          <div className="flex flex-col justify-evenly gap-9 mt-5">
            <div className="font-inter flex flex-col gap-3 md:gap-7">
              <h1 className="uppercase text-2xl md:text-3xl font-bold text-white">
                Welcome !
              </h1>
              <p className="text-white font-medium text-sm md:text-xl">
                To your Ultimate Back end Solution for Seamless Badminton Match
                Management and Coordination
              </p>
            </div>
            <div className="flex justify-between flex-col items-center gap-2 md:gap-5">
              <button
                onClick={() => Navigate("login")}
                className=" py-3 w-[60%] md:w-full sm:w-[80%] bg-white font-medium rounded-3xl text-base md:text-xl scale-95 hover:scale-100"
              >
                Log In
              </button>
              <button
                onClick={() => Navigate("signup")}
                className="border py-3 w-[60%] sm:w-[80%] md:w-full font-medium rounded-3xl text-base  md:text-xl scale-95 hover:scale-100"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Welcome;
