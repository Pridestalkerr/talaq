"use client";

import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@acme/api";
import { env } from "@acme/env";

export const api = createTRPCReact<AppRouter>({});

export const apiVanilla = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
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
});
export { type RouterInputs, type RouterOutputs } from "@acme/api";
