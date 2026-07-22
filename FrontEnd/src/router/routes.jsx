import React from "react";
import Dashboard from "../modules/dashboard/Dashboard";
import FIRModule from "../modules/fir/FIRModule";
import AnalyticsModule from "../modules/analytics/AnalyticsModule";
import NetworkGraphModule from "../modules/network/NetworkGraphModule";
import AIAssistantModule from "../modules/ai/AIAssistantModule";
import SettingsModule from "../modules/settings/SettingsModule";

export const routes = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    label: "Dashboard",
  },
  {
    path: "/firs",
    element: <FIRModule />,
    label: "FIR Management",
  },
  {
    path: "/analytics",
    element: <AnalyticsModule />,
    label: "Analytics & Risk",
  },
  {
    path: "/network",
    element: <NetworkGraphModule />,
    label: "Crime Network",
  },
  {
    path: "/ai-query",
    element: <AIAssistantModule />,
    label: "AI Assistant",
  },
  {
    path: "/settings",
    element: <SettingsModule />,
    label: "System Settings",
  },
];
