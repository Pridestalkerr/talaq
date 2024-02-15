import z from "zod";
import { router } from "../trpc";
import { jobListingMeta, jobListings, skillCategories, skills } from "@acme/db/schemas";
import { db } from "@acme/db";
import { adminProcedure, protectedProcedure } from "../procedures";
import { and, ilike, eq, getTableColumns, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import XLSX from "xlsx";
import { env } from "@acme/env";
import { TRPCError } from "@trpc/server";

const jdSchema = z.object({
  autoReqId: z.string(),
  srNo: z.string(),
  lobDetails: z.string(),
  reportingManager: z.string(),
  requisitionStatus: z.string(),
  tagManager: z.string().nullable(),
  primarySkill: z.string(),
  secondarySkill: z.string().nullable(),
  infraDomain: z.string().nullable(),
  customerName: z.string(),
  band: z.string(),
  subBand: z.string(),
  designation: z.string(),
  experience: z.string().nullable(),
  jobDescription: z.string(),
  jobDescriptionPost: z.string().nullable(),
  country: z.string(),
  requisitionSource: z.string().nullable(),
  billingType: z.string(),
  noOfPositions: z.number().nullable(),
  positionsBalance: z.number().nullable(),
  actionablePositions: z.number().nullable(),
  tp1Interviewer: z.string().nullable(),
  tp2Interviewer: z.string().nullable(),
  companyCode: z.string(),
  initiatorId: z.coerce.string(),
  sla: z.number().nullable(),
  agingInDays: z.number().nullable(),
});

export const uploadRouter = router({
  fromSheet: adminProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/upload/fromSheet",
        summary: "Upload from sheet",
        description: "Upload from sheet",
        tags: ["upload"],
      },
    })
    .input(
      z.object({
        sheet: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const buf = Buffer.from(input.sheet, "base64");
        const data = parseJobsFromSheet(buf);

        const res = await fetch(`${env.NESTA_HOST}/extract/multiple`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ texts: data.map((d) => d.jobDescription) }),
        }).then((res) => res.json());

        const skillsLookup = (
          await db
            .select({
              id: skills.id,
              emsiId: skills.emsiId,
            })
            .from(skills)
        ).reduce(
          (acc, val) => {
            acc[val.emsiId] = val.id;
            return acc;
          },
          {} as Record<string, string>,
        );

        const skillCategoriesLookup = (
          await db
            .select({
              id: skillCategories.id,
              emsiId: skillCategories.emsiId,
            })
            .from(skillCategories)
        ).reduce(
          (acc, val) => {
            acc[val.emsiId] = val.id;
            return acc;
          },
          {} as Record<number, string>,
        );

        const toInsert = [] as {
          jobListing: typeof jobListings.$inferInsert;
          jobListingMeta: Omit<typeof jobListingMeta.$inferInsert, "jobListingId">;
        }[];
        for (const [idx, jd] of data.entries()) {
          // TODO: wtf is this?
          //   console.log("milsugi: ", res.records[`${idx}`]);
          let skillIds: string[] = [];
          let categoryIds: number[] = [];
          if (res.records[idx].SKILL) {
            const emsiSkillIds = res.records[idx].SKILL.map((s) => s[1]).map(
              (s) => s[1],
            ) as string[];
            categoryIds = emsiSkillIds
              .filter(isCategory)
              .map((s) => {
                console.log("in categoryIds extract: ", s);
                const [_, v3] = extractVersionParts(s);
                console.log("v3: ", v3);
                return v3;
              })
              .map((s) => {
                const look = skillCategoriesLookup[s];
                if (!look) {
                  console.log("in categoryIds: ", s);
                }
                return look;
              })
              .filter((s) => s !== undefined);
            skillIds = emsiSkillIds
              .filter((s) => !isCategory(s))
              .map((s) => {
                const look = skillsLookup[s];
                if (!look) {
                  console.log("in skillsIds: ", s);
                }
                return look;
              })
              .filter((s) => s !== undefined);
          }

          toInsert.push({
            jobListing: {
              title: jd.designation,
              description: jd.jobDescription,
              skills: [...new Set(skillIds)],
              categories: [...new Set(categoryIds)],
            },
            jobListingMeta: {
              ...jd,
            },
          });
        }

        await db.transaction(async (trx) => {
          const insertedJobs = await trx
            .insert(jobListings)
            .values(toInsert.map((d) => d.jobListing))
            .returning({
              id: jobListings.id,
            });

          await trx.insert(jobListingMeta).values(
            toInsert.map((job, idx) => ({
              ...job.jobListingMeta,
              jobListingId: insertedJobs[idx]!.id,
            })),
          );
        });

        return {
          status: {
            inserted: 3,
          },
        };
      } catch (err) {
        console.error(err);
        throw new TRPCError({
          message: "Internal server error.",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),
  getSkillsFromExcerpt: adminProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/upload/getSkillsFromExcerpt",
        summary: "Get skills from excerpt",
        description: "Get skills from excerpt",
        tags: ["upload"],
      },
    })
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const res = await fetch(`${env.NESTA_HOST}/extract/one`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: input.text }),
      }).then((res) => res.json());

      console.log(res.record);

      // TODO: I dont like api returning array for single as well
      const SKILL = res.record[0].SKILL;

      const formatted = SKILL.map((s) => s[1]).map((s) => s[1]) as string[];
      const emsiSkillIds = formatted.filter((s) => !isCategory(s));
      const emsiCategoryIds = formatted.filter(isCategory).map((s) => {
        const [_, v3] = extractVersionParts(s);
        return v3;
      });

      const dbSkills = await db.select().from(skills).where(inArray(skills.emsiId, emsiSkillIds));
      const dbCategories = await db
        .select()
        .from(skillCategories)
        .where(inArray(skillCategories.emsiId, emsiCategoryIds));

      return {
        record: {
          skills: dbSkills,
          categories: dbCategories,
        },
      };
    }),
});

const parseJobsFromSheet = (buf: Buffer) => {
  const workbook = XLSX.read(buf, { type: "buffer" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No sheets presented.");
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error("Cannot find worksheet.");
  }

  const range = XLSX.utils.decode_range(worksheet["!ref"]!);
  range.s.r = 5; // skip headers TODO: this is bad, need to enforce sheet format (lol)
  worksheet["!ref"] = XLSX.utils.encode_range(range);

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  const filtered = data.map((row) => {
    const mapped = {} as Record<string, unknown>;
    for (const key in lookup) {
      mapped[key] = row[lookup[key as keyof typeof lookup]] ?? null;
    }
    return jdSchema.parse(mapped);
  });

  return filtered;
};

const lookup = {
  autoReqId: "Auto req ID",
  srNo: "SR Number",
  lobDetails: "LoB Details",
  reportingManager: "Reporting Manager [vReportingManager1]",
  requisitionStatus: "Reqisition Status",
  tagManager: "TAG Manager [TAGManager]",
  primarySkill: "Primary Skill",
  secondarySkill: "Secondary Skill",
  infraDomain: "Domain for INFRA",
  customerName: "Customer Name",
  band: "Band [iBandId]",
  subBand: "Sub Band [vSubBandId]",
  designation: "Designation",
  experience: "Experience [iExperienceId]",
  jobDescription: "Job Description",
  jobDescriptionPost: "Job Description (Posting) [JD_ForPosting]",
  country: "Country",
  requisitionSource: "Requisition Source [iRequistionSource]",
  billingType: "Billing Type [iBillingTypeId]",
  noOfPositions: "No. of Positions",
  positionsBalance: "Balance Positions",
  actionablePositions: "Actionable Positions [Vacancies]",
  tp1Interviewer: "TP1 Interveiwer",
  tp2Interviewer: "TP2 Interveiwer",
  companyCode: "Company Code [vcomp_code]",
  initiatorId: "Initiator Id",
  sla: "SLA",
  agingInDays: "Ageing in Days",
} as const satisfies {
  [key in keyof z.infer<typeof jdSchema>]: string;
};

function extractVersionParts(input: string): [number, number] {
  const [v1, v2, v3, v4] = input.split(".").map(Number);
  return [v1!, v3!];
}

function isCategory(input: string): boolean {
  const pattern = /^\d+\.0\.\d+\.0$/;
  return pattern.test(input);
}
