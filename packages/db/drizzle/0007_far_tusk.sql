ALTER TABLE "job_listing_meta" ALTER COLUMN "reporting_manager" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ALTER COLUMN "requisition_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ALTER COLUMN "primary_skill" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ALTER COLUMN "customer_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ALTER COLUMN "designation" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ALTER COLUMN "experience" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "job_listing_meta" ALTER COLUMN "band" SET DATA TYPE varchar(30);--> statement-breakpoint
ALTER TABLE "job_listing_meta" ALTER COLUMN "band" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ALTER COLUMN "country" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "lob_details" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "tag_manager" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "secondary_skill" varchar(255);--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "infra_domain" varchar(255);--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "sub_band" varchar(30) NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "requisition_source" varchar(255);--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "billing_type" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "no_of_positions" integer;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "positions_balance" integer;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "actionable_positions" integer;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "tp1_interviewer" varchar(255);--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "tp2_interviewer" varchar(255);--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "company_code" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "initiator_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "sla" integer;--> statement-breakpoint
ALTER TABLE "job_listing_meta" ADD COLUMN "aging_in_days" integer;--> statement-breakpoint
ALTER TABLE "job_listing_meta" DROP COLUMN IF EXISTS "recruiter";