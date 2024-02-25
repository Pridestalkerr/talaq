// import { TRPCError } from "@trpc/server";
import z from "zod";
import { router } from "../trpc";
import { employees, skillCategories, skills } from "@acme/db/schemas";
import { db } from "@acme/db";
import { adminProcedure, protectedProcedure } from "../procedures";
import { and, ilike, eq, getTableColumns, or, sql, asc, count, SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const employeesRouter = router({
  search: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/employees/search",
        summary: "Search employees",
        description: "Search employees",
        tags: ["employees"],
      },
    })
    .input(
      z.object({
        searchQuery: z.string().min(3).optional(),
        offset: z.number().default(0),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ input, ctx }) => {
      const searchByFields = [
        employees.firstName,
        employees.lastName,
        employees.contactEmail,
        employees.contactPhone,
        employees.employeeNumber,
        employees.primarySkill,
        employees.secondarySkill,
        employees.band,
        employees.subBand,
      ];

      const searchCondition = input.searchQuery
        ? or(...searchByFields.map((field) => ilike(field, `%${input.searchQuery}%`)))
        : undefined;

      const whereClauses = [...(searchCondition ? [searchCondition] : [])];

      const records = await db
        .select({
          ...getTableColumns(employees),
          // i dont think this is good
          //   total: sql<number>`(count(*) OVER())::integer`,
        })
        .from(employees)
        .where(and(...whereClauses))
        .orderBy(asc(employees.employeeNumber))
        .offset(input.offset ?? 0)
        .limit(input.limit ?? 10);

      const [total] = await db
        .select({
          count: count(employees.id),
        })
        .from(employees)
        .where(and(...whereClauses));

      return {
        records,
        total: total?.count ?? 0,
      };
    }),
});

//TODO: havent found a better way to do this, not even sure its properly sanitized
// should be fine for now, as its only used in admin endpoints
const sanitizeArray = (arr: string[]) => {
  const sanitizedArray: SQL<unknown>[] = [sql`[`];
  const rawArray: SQL<unknown>[] = [];

  for (const element of arr) {
    rawArray.push(sql`${element}`);
  }
  sanitizedArray.push(sql.join(rawArray, sql`, `));
  sanitizedArray.push(sql`]`);

  const sanitizedQuery = sql.join(sanitizedArray);
  return sanitizedQuery;
};
