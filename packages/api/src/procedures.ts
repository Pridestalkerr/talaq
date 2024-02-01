import { baseProtectedProcedureMiddleware } from "./middleware";
import { trpc } from "./trpc";

export const publicProcedure = trpc.procedure;
export const protectedProcedure = trpc.procedure.use(baseProtectedProcedureMiddleware);
