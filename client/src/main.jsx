import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
// import { BackendProvider } from "./ContextAPI/connectToBackend.jsx";
import { BackendProvider } from "./ContextAPI/axios.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Welcome,
  Login,
  Signup,
  Home,
  Accounts,
  Events,
  Recent_Event,
  Weekly_Event,
  Upcoming_Event,
  LiveScore,
  PastMatch,
  Courts,
  Setting,
  ForgotPassword,
  ScorePage,
  MatchDetails,
  Umpire,
} from "./pages/pages.js";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Welcome />} />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="forgotpassword" element={<ForgotPassword />} />
      <Route element={<App />}>
        <Route path="home" element={<Home />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="players" element={<Navigate to="/accounts" replace />} />
        <Route path="livescore" element={<LiveScore />} />
        <Route path="matchdetails/:id" element={<MatchDetails />} />
        <Route path="events" element={<Events />}>
          <Route path="" element={<Recent_Event />} />
          <Route path="weekly" element={<Weekly_Event />} />
          <Route path="upcoming" element={<Upcoming_Event />} />
        </Route>
        <Route path="pastmatches" element={<PastMatch />} />
        <Route path="user/setting" element={<Setting />} />
      </Route>
      <Route path="umpire/:id" element={<Umpire />} />
      <Route path="scorepage/:id" element={<ScorePage />} />
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BackendProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </BackendProvider>
  </StrictMode>
);
