import { QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient();

  if (typeof window !== "undefined" && (!window.location.hash || window.location.hash === "#")) {
    window.location.hash = "#/";
  }

  const hashHistory = createHashHistory();

  const router = createRouter({
    routeTree,
    history: hashHistory,
    defaultPreload: "intent",
    context: { queryClient },
  });

  return router;
}
