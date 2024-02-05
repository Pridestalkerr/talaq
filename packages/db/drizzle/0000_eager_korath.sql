DO $$ BEGIN
 CREATE TYPE "ST_enum" AS ENUM('ST0', 'ST1', 'ST2', 'ST3');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"emsi_id" integer NOT NULL,
	"is_subcategory" boolean NOT NULL,
	CONSTRAINT "skill_categories_id_unique" UNIQUE("id"),
	CONSTRAINT "skill_categories_emsi_id_unique" UNIQUE("emsi_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emsi_id" text NOT NULL,
	"name" text NOT NULL,
	"info_url" text,
	"description" text,
	"description_source" text,
	"is_language" boolean NOT NULL,
	"is_software" boolean NOT NULL,
	"category_id" uuid,
	"subcategory_id" uuid,
	"type" text,
	CONSTRAINT "skills_id_unique" UNIQUE("id"),
	CONSTRAINT "skills_emsi_id_unique" UNIQUE("emsi_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "skills" ADD CONSTRAINT "skills_subcategory_id_skill_categories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "skill_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
