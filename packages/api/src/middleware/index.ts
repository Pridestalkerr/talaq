import { TRPCError } from "@trpc/server";
import { trpc } from "../trpc";

export const baseProtectedProcedureMiddleware = trpc.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ message: "Unauthorized. You must be logged in.", code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      // infers the `session` as non-nullable
      session: ctx.session,
      token: ctx.token as string,
    },
  });
});
