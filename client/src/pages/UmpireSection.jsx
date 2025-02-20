import React, { useEffect } from "react";
import MatchList from "../components/MatchList";
import { useService } from "../ContextAPI/axios";
import { useNavigate } from "react-router-dom";
const UmpireSection = ({ matches }) => {
  const { getYourData, myData, logOut } = useService();
  const Navigate = useNavigate();
  useEffect(() => {
    getYourData();
  }, []);

  useEffect(() => { }, [myData]);

  const handleLogout = () => {
    logOut();
    Navigate("/");
  };

  function toSentenceCase(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  return (
    <div>
      <h1 className="text-5xl text-center py-5 font-bold font-inter">Umpire Section</h1>
      <div className="flex justify-between items-center px-10 py-5">
        <h4 className="text-2xl font-inter">
          Hello {toSentenceCase(myData?.username)}{" "}
        </h4>
        <button className="bg-red-500 text-white px-4 py-2 rounded-md" onClick={handleLogout}>Log Out</button>
      </div>
      {matches?.map((matche, index) => (
        <MatchList match={matche} key={index} />
      ))}
    </div>
  );
};

export default UmpireSection;
