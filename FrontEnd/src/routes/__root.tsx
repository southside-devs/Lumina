import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, AuthGuard } from "@/lib/auth";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.hash = "#/";
      router.navigate({ to: "/" });
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mx-auto mb-4 border border-amber-500/30 animate-pulse">
          <span className="material-symbols-outlined text-2xl">radar</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Aligning Tactical Coordinates...</h1>
        <p className="mt-2 text-xs text-muted-foreground font-mono">
          Connecting to Karnataka State Police Command Center...
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Launch Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root error boundary caught:", error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white font-sans">
      <div className="max-w-lg text-center bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
        <div className="size-12 rounded-full bg-red-950/80 border border-red-800/50 flex items-center justify-center mx-auto mb-3 text-red-400">
          <span className="material-symbols-outlined text-2xl">warning</span>
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Tactical Interface Exception
        </h1>
        <p className="mt-2 text-xs text-zinc-400 font-mono leading-relaxed bg-black/60 p-3 rounded-lg border border-zinc-800 text-left overflow-x-auto text-red-300">
          {error?.message || "An unexpected rendering fault occurred."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 cursor-pointer"
          >
            Retry Module
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Return to Command Center
          </a>
        </div>
      </div>
    </div>
  );
}


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Lovable Generated Project" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Lovable Generated Project" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,100..700,0..1,0&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <>
      <HeadContent />
      {children}
      <Scripts />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </AuthGuard>
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
