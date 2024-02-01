import { router } from "./trpc";
import type { ProcedureRouterRecord, inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AnyProcedureBuilderDef } from "@trpc/server/dist/core/internals/procedureBuilder";
import { z } from "zod";
import { testRouter } from "./router/test";

export const appRouter = router({
  test: testRouter,
});

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// This is a hack to make sure that all procedures that have an openapi def have an output type
// Only useful if you're actually using the openapi generator
const procedures = appRouter._def.procedures as ProcedureRouterRecord;
Object.keys(procedures).forEach((key) => {
  const def = procedures[key]?._def as AnyProcedureBuilderDef;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (def?.meta?.openapi && !def.output) {
    def.output = z.any();
  }
});
