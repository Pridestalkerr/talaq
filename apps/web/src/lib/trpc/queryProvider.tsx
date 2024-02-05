"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { PropsWithChildren, useState } from "react";
import { api } from "./client";
import superjson from "superjson";
import { env } from "@acme/env";
import { toast } from "react-toastify";

const noErrorPaths = ["auth.me"];

const errorHandler = (err: unknown) => {
  const errCast = err as {
    data?: {
      path: string;
    };
    message?: string;
  };
  if (noErrorPaths.includes(errCast.data?.path ?? "")) return;
  if (typeof errCast === "object" && errCast !== null && "message" in errCast) {
    toast(errCast.message, {
      type: "error",
    });
  } else {
    console.error("Unexpected error:", err);
  }
};

export default function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: errorHandler,
        }),
        mutationCache: new MutationCache({
          onError: errorHandler,
        }),
      }),
  );

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          // TODO: define the route in api package
          url: env.NEXT_PUBLIC_API_HOST + env.NEXT_PUBLIC_API_ENDPOINT + "/trpc",
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
        }),
      ],
      transformer: superjson,
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <>{children}</>
      </QueryClientProvider>
    </api.Provider>
  );
}
