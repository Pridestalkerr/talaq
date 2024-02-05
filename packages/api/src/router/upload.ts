// import { TRPCError } from "@trpc/server";
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
  reportingManager: z.string(),
  requisitionStatus: z.string(),
  recruiter: z.string(),
  primarySkill: z.string(),
  customerName: z.string(),
  designation: z.string(),
  experience: z.string(),
  jobDescription: z.string(),
  // if this is undefined, then return null
  jobDescriptionPost: z.string().nullable().optional(),
  band: z.string(),
  country: z.string(),
});

type JobPosting = {
  autoReqId: string;
  srNo: string;
  reportingManager: string;
  requisitionStatus: string;
  recruiter: string;
  primarySkill: string;
  customerName: string;
  designation: string;
  experience: string;
  jobDescription: string;
  jobDescriptionPost: string;
  band: string;
  country: string;
};

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

        // console.log(typeof res.records);
        // console.log(res.records.length);
        // console.log(Object.keys(res));
        // console.log(typeof res.records);
        // console.log(Object.keys(res.records));
        // console.log(res.records[`${0}`]);
        // console.log(Object.keys(res.records[`${0}`]));
        // console.log(res.records[`${0}`].SKILL);

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
          jobListingMeta: typeof jobListingMeta.$inferInsert;
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
              autoReqId: jd.autoReqId,
              srNo: jd.srNo,
              reportingManager: jd.reportingManager ?? null,
              requisitionStatus: jd.requisitionStatus ?? null,
              recruiter: jd.recruiter ?? null,
              primarySkill: jd.primarySkill ?? null,
              customerName: jd.customerName ?? null,
              designation: jd.designation,
              experience: jd.experience ?? null,
              jobDescription: jd.jobDescription,
              jobDescriptionPost: jd.jobDescriptionPost ?? null,
              band: jd.band ?? null,
              country: jd.country ?? null,
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
    const mapped = {
      autoReqId: row[lookup.autoReqId],
      srNo: row[lookup.srNo],
      reportingManager: row[lookup.reportingManager],
      requisitionStatus: row[lookup.requisitionStatus],
      recruiter: row[lookup.recruiter],
      primarySkill: row[lookup.primarySkill],
      customerName: row[lookup.customerName],
      designation: row[lookup.designation],
      experience: row[lookup.experience],
      jobDescription: row[lookup.jobDescription],
      jobDescriptionPost: row[lookup.jobDescriptionPost],
      band: row[lookup.band],
      country: row[lookup.country],
    };
    return jdSchema.parse(mapped);
  });

  return filtered;
};

const lookup = {
  autoReqId: "Auto req ID",
  srNo: "SR Number",
  reportingManager: "Reporting Manager [vReportingManager1]",
  requisitionStatus: "Reqisition Status",
  recruiter: "Recruiter",
  primarySkill: "Primary Skill",
  customerName: "Customer Name",
  designation: "Designation",
  experience: "Experience [iExperienceId]",
  jobDescription: "Job Description",
  jobDescriptionPost: "Job Description (Posting) [JD_ForPosting]",
  band: "Band [iBandId]",
  country: "Country",
} as const;

function extractVersionParts(input: string): [number, number] {
  const [v1, v2, v3, v4] = input.split(".").map(Number);
  return [v1!, v3!];
}

function isCategory(input: string): boolean {
  const pattern = /^\d+\.0\.\d+\.0$/;
  return pattern.test(input);
}
