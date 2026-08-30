import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { FIREventProvider } from "./lib/fir-events";
import "./styles.css";

// Ensure initial hash exists for Catalyst subpath hosting
if (typeof window !== "undefined" && (!window.location.hash || window.location.hash === "#")) {
  window.location.hash = "#/";
}

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FIREventProvider>
      <RouterProvider router={router} />
    </FIREventProvider>
  </React.StrictMode>
);
