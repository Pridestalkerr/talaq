CREATE TABLE IF NOT EXISTS "job_listing_meta" (
	"auto_req_id" varchar(255) NOT NULL,
	"sr_no" varchar(255) NOT NULL,
	"reporting_manager" varchar(255),
	"requisition_status" varchar(255),
	"recruiter" varchar(255),
	"primary_skill" varchar(255),
	"customer_name" varchar(255),
	"designation" varchar(255),
	"experience" varchar(255),
	"job_description" text,
	"job_description_post" text,
	"band" varchar(255),
	"country" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"skills" uuid[] DEFAULT ARRAY[]::uuid[],
	"categories" uuid[] DEFAULT ARRAY[]::uuid[]
);
