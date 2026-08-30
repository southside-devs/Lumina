import { QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient();
  const hashHistory = createHashHistory();

  const router = createRouter({
    routeTree,
    history: hashHistory,
    context: { queryClient },
  });

  return router;
}
