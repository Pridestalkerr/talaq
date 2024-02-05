import z from "zod";
import { publicProcedure, protectedProcedure, adminProcedure } from "../procedures";
import { router } from "../trpc";
import { auth } from "@acme/auth";
import { env } from "@acme/env";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  // TODO: csrf protection
  // disabling login for now
  login: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/login",
        summary: "Login",
        description: "Login",
        tags: ["auth"],
      },
    })
    .input(
      z.object({
        provider: z.enum(["EMAIL"]),
        providerUserId: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session) {
        throw new TRPCError({
          message: "Already logged in",
          code: "BAD_REQUEST",
        });
      }
      try {
        const key = await auth.useKey({
          providerId: input.provider,
          providerUserId: input.providerUserId,
          password: input.password,
        });
        const session = await auth.createSession({
          userId: key.userId,
          attributes: {},
        });
        ctx.res.cookie("token", session.id, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days, can be set to idleExpires - now
        });
      } catch (err) {
        console.error(err);
        throw new TRPCError({
          message: "Invalid credentials",
          code: "BAD_REQUEST",
        });
      }
      return;
    }),
  logout: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/logout",
        summary: "Logout",
        description: "Logout",
        tags: ["auth"],
      },
    })
    .input(z.void())
    .mutation(async ({ ctx }) => {
      const token = ctx.session?.id;
      if (token) {
        await auth.invalidateSession(token);
      }
      ctx.res.cookie("token", "", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
      });
    }),
  // this should probably be public
  me: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/auth/me",
        summary: "Me",
        description: "Me",
        tags: ["auth"],
      },
    })
    .input(z.void())
    .query(({ ctx }) => {
      return {
        record: ctx.session?.user ?? null,
      };
    }),
});
