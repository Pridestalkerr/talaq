import { RouterOutputs } from "@/lib/trpc/client";
import { z } from "zod";

export type Job = RouterOutputs["jobsRouter"]["search"]["records"][number];
export type JobMatch = RouterOutputs["jobsRouter"]["match"]["records"][number];

export const jdSchema = z.object({
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

export const jdLookup = {
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

export const jobCols = Object.keys(jdSchema.shape).map((key) => {
  const k = key as keyof typeof jdLookup;
  return {
    name: jdLookup[k],
    get: (job: Job) => job.meta?.[k] ?? "N/A",
    identifier: k,
  };
});
