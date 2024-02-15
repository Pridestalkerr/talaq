// import { TRPCError } from "@trpc/server";
import z from "zod";
import { router } from "../trpc";
import { jobListingMeta, jobListings, skillCategories, skills } from "@acme/db/schemas";
import { db } from "@acme/db";
import { adminProcedure, protectedProcedure } from "../procedures";
import { and, ilike, eq, getTableColumns, or, sql, asc, count, SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export const jobsRouter = router({
  search: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/jobs/search",
        summary: "Search jobs",
        description: "Search jobs",
        tags: ["jobs"],
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
      console.log(input);
      getTableColumns(jobListingMeta);
      // const searchByFields = [...Object.values(getTableColumns(jobListingMeta))];
      const searchByFields = [
        jobListingMeta.srNo,
        jobListingMeta.autoReqId,
        jobListingMeta.lobDetails,
        jobListingMeta.reportingManager,
        jobListingMeta.requisitionStatus,
        jobListingMeta.tagManager,
        jobListingMeta.primarySkill,
        jobListingMeta.secondarySkill,
        jobListingMeta.infraDomain,
        jobListingMeta.customerName,
        jobListingMeta.band,
        jobListingMeta.subBand,
        jobListingMeta.designation,
        jobListingMeta.experience,
        jobListingMeta.jobDescription,
        jobListingMeta.jobDescriptionPost,
        jobListingMeta.country,
        jobListingMeta.requisitionSource,
        jobListingMeta.billingType,
        jobListingMeta.tp1Interviewer,
        jobListingMeta.tp2Interviewer,
        jobListingMeta.companyCode,
        jobListingMeta.initiatorId,
      ];

      const searchCondition = input.searchQuery
        ? or(...searchByFields.map((field) => ilike(field, `%${input.searchQuery}%`)))
        : undefined;

      const whereClauses = [...(searchCondition ? [searchCondition] : [])];

      const records = await db
        .select({
          ...getTableColumns(jobListings),
          meta: { ...getTableColumns(jobListingMeta) },
        })
        .from(jobListings)
        .where(and(...whereClauses))
        .leftJoin(jobListingMeta, eq(jobListingMeta.jobListingId, jobListings.id))
        .orderBy(asc(jobListingMeta.srNo))
        .offset(input.offset ?? 0)
        .limit(input.limit ?? 10);

      const [total] = await db
        .select({
          count: count(jobListings.id),
        })
        .from(jobListings)
        .where(and(...whereClauses))
        .leftJoin(jobListingMeta, eq(jobListingMeta.jobListingId, jobListings.id));

      return {
        records,
        total: total?.count ?? 0,
      };
    }),

  getById: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/jobs/getById",
        summary: "Get job by id",
        description: "Get job by id",
        tags: ["jobs"],
      },
    })
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      type X = Omit<typeof jobListings.$inferSelect, "skills" | "categories"> & {
        skills: (typeof skills.$inferSelect)[];
        categories: (typeof skillCategories.$inferSelect)[];
        meta: typeof jobListingMeta.$inferSelect;
      };
      const [a] = await db.execute<X>(sql`
        SELECT
            ${jobListings.id},
            ${jobListings.description},
            (
                SELECT json_agg(json_build_object(
                    'id', ${skills.id},
                    'name', ${skills.name},
                    'emsiId', ${skills.emsiId}
                )) FROM unnest(${jobListings.skills}) AS skillId
                LEFT JOIN ${skills} ON ${skills.id} = skillId
            ) AS skills,
            (
                SELECT json_agg(json_build_object(
                    'id', ${skillCategories.id},
                    'name', ${skillCategories.name},
                    'emsiId', ${skillCategories.emsiId},
                    'isSubcategory', ${skillCategories.isSubcategory}
                )) FROM unnest(${jobListings.categories}) AS categoryId
                LEFT JOIN ${skillCategories} ON ${skillCategories.id} = categoryId
            ) AS categories,
            json_build_object(
                'autoReqId', ${jobListingMeta.autoReqId},
                'srNo', ${jobListingMeta.srNo},
                'lobDetails', ${jobListingMeta.lobDetails},
                'reportingManager', ${jobListingMeta.reportingManager},
                'requisitionStatus', ${jobListingMeta.requisitionStatus},
                'tagManager', ${jobListingMeta.tagManager},
                'primarySkill', ${jobListingMeta.primarySkill},
                'secondarySkill', ${jobListingMeta.secondarySkill},
                'infraDomain', ${jobListingMeta.infraDomain},
                'customerName', ${jobListingMeta.customerName},
                'band', ${jobListingMeta.band},
                'subBand', ${jobListingMeta.subBand},
                'designation', ${jobListingMeta.designation},
                'experience', ${jobListingMeta.experience},
                'jobDescription', ${jobListingMeta.jobDescription},
                'jobDescriptionPost', ${jobListingMeta.jobDescriptionPost},
                'country', ${jobListingMeta.country},
                'requisitionSource', ${jobListingMeta.requisitionSource},
                'billingType', ${jobListingMeta.billingType},
                'noOfPositions', ${jobListingMeta.noOfPositions},
                'positionsBalance', ${jobListingMeta.positionsBalance},
                'actionablePositions', ${jobListingMeta.actionablePositions},
                'tp1Interviewer', ${jobListingMeta.tp1Interviewer},
                'tp2Interviewer', ${jobListingMeta.tp2Interviewer},
                'companyCode', ${jobListingMeta.companyCode},
                'initiatorId', ${jobListingMeta.initiatorId},
                'sla', ${jobListingMeta.sla},
                'agingInDays', ${jobListingMeta.agingInDays}
            ) AS meta
        FROM ${jobListings}
        LEFT JOIN ${jobListingMeta} ON ${jobListingMeta.jobListingId} = ${jobListings.id}
        WHERE ${jobListings.id} = ${input.id}
      `);

      return {
        record: a,
      };
    }),
  // TODO: cant pass array to trpc-openapi
  match: adminProcedure
    // .meta({
    //   openapi: {
    //     method: "GET",
    //     path: "/jobs/match",
    //     summary: "match jobs",
    //     description: "match jobs",
    //     tags: ["jobs"],
    //   },
    // })
    .input(
      z.object({
        country: z.string().optional(),
        primarySkill: z.string().optional(),
        offset: z.number().default(0),
        limit: z.number().default(10),
        skills: z.array(z.string()),
      }),
    )
    .query(async ({ input, ctx }) => {
      const sanitizedTokens = sanitizeArray(input.skills);

      type X = Omit<typeof jobListings.$inferSelect, "skills" | "categories"> & {
        skills: (typeof skills.$inferSelect)[];
        categories: (typeof skillCategories.$inferSelect)[];
        meta: typeof jobListingMeta.$inferSelect;
        matchcount: number;
        totalcount: number;
      };

      const records = await db.execute<X>(sql`
        SELECT
            ${jobListings.id},
            ${jobListings.description},
            (
                SELECT json_agg(json_build_object(
                    'id', ${skills.id},
                    'name', ${skills.name},
                    'emsiId', ${skills.emsiId}
                )) FROM unnest(${jobListings.skills}) AS skillId
                LEFT JOIN ${skills} ON ${skills.id} = skillId
            ) AS skills,
            (
                SELECT json_agg(json_build_object(
                    'id', ${skillCategories.id},
                    'name', ${skillCategories.name},
                    'emsiId', ${skillCategories.emsiId},
                    'isSubcategory', ${skillCategories.isSubcategory}
                )) FROM unnest(${jobListings.categories}) AS categoryId
                LEFT JOIN ${skillCategories} ON ${skillCategories.id} = categoryId
            ) AS categories,
            json_build_object(
              'autoReqId', ${jobListingMeta.autoReqId},
              'srNo', ${jobListingMeta.srNo},
              'lobDetails', ${jobListingMeta.lobDetails},
              'reportingManager', ${jobListingMeta.reportingManager},
              'requisitionStatus', ${jobListingMeta.requisitionStatus},
              'tagManager', ${jobListingMeta.tagManager},
              'primarySkill', ${jobListingMeta.primarySkill},
              'secondarySkill', ${jobListingMeta.secondarySkill},
              'infraDomain', ${jobListingMeta.infraDomain},
              'customerName', ${jobListingMeta.customerName},
              'band', ${jobListingMeta.band},
              'subBand', ${jobListingMeta.subBand},
              'designation', ${jobListingMeta.designation},
              'experience', ${jobListingMeta.experience},
              'jobDescription', ${jobListingMeta.jobDescription},
              'jobDescriptionPost', ${jobListingMeta.jobDescriptionPost},
              'country', ${jobListingMeta.country},
              'requisitionSource', ${jobListingMeta.requisitionSource},
              'billingType', ${jobListingMeta.billingType},
              'noOfPositions', ${jobListingMeta.noOfPositions},
              'positionsBalance', ${jobListingMeta.positionsBalance},
              'actionablePositions', ${jobListingMeta.actionablePositions},
              'tp1Interviewer', ${jobListingMeta.tp1Interviewer},
              'tp2Interviewer', ${jobListingMeta.tp2Interviewer},
              'companyCode', ${jobListingMeta.companyCode},
              'initiatorId', ${jobListingMeta.initiatorId},
              'sla', ${jobListingMeta.sla},
              'agingInDays', ${jobListingMeta.agingInDays}
            ) AS meta,
            matchCount::integer AS matchCount,
            (COUNT(*) OVER())::integer AS totalCount
        FROM
            ${jobListings}
            LEFT JOIN LATERAL (
                SELECT
                    COUNT(*) AS matchCount
                FROM unnest(${jobListings.skills}) AS skillId
                WHERE skillId = ANY(ARRAY${sanitizedTokens}::UUID[])
            ) AS match ON true
            LEFT JOIN ${jobListingMeta} ON ${jobListingMeta.jobListingId} = ${jobListings.id}
        WHERE ${and(
          ilike(jobListingMeta.country, input.country ? `%${input.country}%` : "%"),
          ilike(jobListingMeta.primarySkill, input.primarySkill ? `%${input.primarySkill}%` : "%"),
        )}
        AND matchCount > 0
        ORDER BY matchCount DESC
        OFFSET ${input.offset ?? 0}
        LIMIT ${input.limit ?? 15}
      `);

      return {
        records,
      };
    }),
  clear: adminProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/jobs/clear",
        summary: "Clear jobs",
        description: "Clear jobs",
        tags: ["jobs"],
      },
    })
    .input(z.void())
    .mutation(async ({ ctx }) => {
      await db.transaction(async (trx) => {
        await trx.delete(jobListingMeta);
        await trx.delete(jobListings);
      });
      return {
        success: true,
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
