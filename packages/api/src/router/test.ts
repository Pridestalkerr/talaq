import z from "zod";
import { publicProcedure } from "../procedures";
import { router } from "../trpc";

export const testRouter = router({
  hello: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/test/hello",
        summary: "Say hello",
        description: "Say hello to the world",
        tags: ["test", "hello"],
      },
    })
    .input(z.object({ name: z.string() }))
    .query(({ input, ctx }) => {
      ctx.req;
      ctx.res;
      return { message: `Hello ${input.name}` };
    }),
});
