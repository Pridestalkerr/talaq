import { TRPCError } from "@trpc/server";
import { baseProtectedProcedureMiddleware } from "./middleware";
import { trpc } from "./trpc";

export const publicProcedure = trpc.procedure;
export const protectedProcedure = trpc.procedure.use(baseProtectedProcedureMiddleware);
export const adminProcedure = protectedProcedure.use(
  trpc.middleware(({ ctx, next }) => {
    if (!ctx.isAdmin) {
      throw new TRPCError({
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session!,
        isAdmin: true,
      },
    });
  }),
);
