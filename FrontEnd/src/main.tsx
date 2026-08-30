import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { FIREventProvider } from "./lib/fir-events";
import "./styles.css";

const router = getRouter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FIREventProvider>
      <RouterProvider router={router} />
    </FIREventProvider>
  </React.StrictMode>
);
