// import { TRPCError } from "@trpc/server";
import z from "zod";
import { router } from "../trpc";
import { skillCategories, skills } from "@acme/db/schemas";
import { db } from "@acme/db";
import { adminProcedure, protectedProcedure } from "../procedures";
import { and, ilike, eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const skillsRouter = router({
  categories: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/categories",
        summary: "Get categories",
        description: "Get categories",
        tags: ["skills"],
      },
    })
    .input(
      z.object({
        search: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx: { session } }) => {
      const whereClauses = [...(input.search ? [ilike(skills.name, `%${input.search}%`)] : [])];
      const records = await db
        .select()
        .from(skillCategories)
        .where(and(...whereClauses));
      return {
        records,
      };
    }),
  skills: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/skills",
        summary: "Get skills",
        description: "Get skills",
        tags: ["skills"],
      },
    })
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const whereClauses = [...(input.search ? [ilike(skills.name, `%${input.search}%`)] : [])];
      const ptr = alias(skillCategories, "ptr");
      const records = await db
        .select({
          ...getTableColumns(skills),
          category: { ...getTableColumns(skillCategories) },
          subcategory: { ...getTableColumns(ptr) },
        })
        .from(skills)
        .where(and(...whereClauses))
        .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
        .leftJoin(ptr, eq(ptr.id, skills.subcategoryId))
        .limit(input.limit ?? 10);
      return {
        records,
      };
    }),
  getById: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/skills/getById",
        summary: "Get skill by id",
        description: "Get skill by id",
        tags: ["skills"],
      },
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const ptr = alias(skillCategories, "ptr");
      const [record] = await db
        .select({
          ...getTableColumns(skills),
          category: { ...getTableColumns(skillCategories) },
          subcategory: { ...getTableColumns(ptr) },
        })
        .from(skills)
        .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
        .leftJoin(ptr, eq(ptr.id, skills.subcategoryId))
        .where(eq(skills.id, input.id));
      return {
        record,
      };
    }),
});
