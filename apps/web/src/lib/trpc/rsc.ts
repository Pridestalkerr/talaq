import { TRPCClientError, TRPCLink, createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { loggerLink } from "@trpc/client";
import type { AppRouter } from "@acme/api";
import superjson from "superjson";
import { env } from "@acme/env";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import { notFound, redirect } from "next/navigation";
import { headers, cookies } from "next/headers";

// pray to god at least this is going to work
const api = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    // customLink,
    loggerLink({
      enabled: (op) => true,
    }),
    httpBatchLink({
      url: env.NEXT_PUBLIC_API_HOST + env.NEXT_PUBLIC_API_ENDPOINT + "/trpc",
      // You can pass any HTTP headers you wish here
      async headers({ opList }) {
        const token = opList[0]?.context?.token ?? cookies().get("token")?.value;
        // const token = cookies().get("token")?.value;
        return {
          ...(token ? { Cookie: `token=${token}` } : {}),
        };
      },
    }),
  ],
});

export type ApiClientType = typeof api;

export function isTRPCClientError(cause: unknown): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}

export async function apiServer<T>(fn: (routers: typeof api) => Promise<T>) {
  try {
    return await fn(api);
  } catch (e) {
    if (isTRPCClientError(e)) {
      if (e.shape?.code === TRPC_ERROR_CODES_BY_KEY.NOT_FOUND) {
        notFound();
      } else if (e.shape?.code === TRPC_ERROR_CODES_BY_KEY.TOO_MANY_REQUESTS) {
        const path = headers().get("x-pathname");
        redirect(`/rate-limit?path=${path}`);
      }
    }

    throw e;
  }
}

// export { api };
export { type RouterInputs, type RouterOutputs } from "@acme/api";
