import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import { Outlet } from "react-router-dom";
import { useService } from "./ContextAPI/axios";
import Watermark from "./components/Watermark";
import UmpireSection from "./pages/UmpireSection";

function App() {
  const { token, getYourData, myData } = useService();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    getYourData();
  }, []);

  useEffect(() => {
    if (myData) {
      setLoading(true);
    }
  }, [myData]);

  return (
    <>
      {token ? (
        <div>
          {isLoading ? (
            <div>
              {myData?.jobrole == "umpire" ? (
                <UmpireSection matches={myData?.matches} />
              ) : (
                <div>
                  <main className="flex">
                    <div className="relative -left-[90px] md:-left-[80px]">
                      <Navbar />
                    </div>
                    <div className="w-full flex-1 ml-[-4rem] md:ml-[-3rem] md:mr-[2rem] overflow-auto">
                      <Outlet />
                    </div>
                  </main>
                  <footer className="text-center">
                    <div className="opacity-50 text-5xl md:text-7xl xl:text-9xl select-none">
                      <Watermark />
                    </div>
                    <div className="text-white font-inter text-[0.75rem] md:text-[1rem] tracking-widest">
                      Maintained and developed by <span className="font-bold">ESH<span className="font-bold text-[#d86dfc]">WAY</span></span>
                    </div>
                  </footer>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h1>Loading...</h1>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center relative top-10 text-4xl text-white font-inter font-bold">
          <h1>401 Unauthorized to Access</h1>
        </div>
      )}
    </>
  );
}

export default App;
