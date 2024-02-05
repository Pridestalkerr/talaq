import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { env } from "@acme/env";
import type { response, request } from "express";
import type { OpenApiMeta } from "trpc-openapi";
import { auth } from "@acme/auth";

type Session = Awaited<ReturnType<typeof auth.validateSession>>;

export interface Context {
  session: Session | null;
  isAdmin: boolean;
  token: string | null;
  req: typeof request;
  res: typeof response;
}

export const createTRPCContext = async ({
  req,
  res,
}: CreateExpressContextOptions): Promise<Context> => {
  // auth bypass for dev
  if (env.NODE_ENV === "development" && req.headers["override-auth"]) {
    const session = {
      userId: req.headers["override-auth"] as string,
    } as Context["session"];
    return {
      session,
      isAdmin: true,
      token: null,
      req,
      res,
    };
  }

  const cookies = req.cookies as Record<string, string>;
  const token = cookies.token;
  let session: Context["session"] = null;

  if (token) {
    try {
      session = await auth.validateSession(token);
    } catch (err) {
      console.error("Error validating session", err);
    }
  }

  return {
    session,
    token: token ?? null,
    isAdmin: session?.user.isAdmin ?? false,
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
