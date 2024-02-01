import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { env } from "@acme/env";
import type { response, request } from "express";
import type { OpenApiMeta } from "trpc-openapi";

interface Session {
  token: string;
}

export interface Context {
  session: Session;
  req: typeof request;
  res: typeof response;
}

export const createTRPCContext = async ({
  req,
  res,
  // eslint-disable-next-line @typescript-eslint/require-await
}: CreateExpressContextOptions): Promise<Context> => {
  const cookies = req.cookies as Record<string, string>;
  const token = cookies.token;

  return {
    session: {
      token: token ?? "",
    },
    req,
    res,
  };
};

export const trpc = initTRPC
  .context<Context>()
  .meta<OpenApiMeta>()
  .create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
      if (error.code === "INTERNAL_SERVER_ERROR" && env.NODE_ENV === "production") {
        return {
          ...shape,
          message: "An unknown error occurred",
        };
      }
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : undefined,
        },
      };
    },
  });

export const router = trpc.router;
