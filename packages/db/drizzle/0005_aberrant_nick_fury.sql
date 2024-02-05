ALTER TABLE "job_listing_meta" ADD COLUMN "job_listing_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_listing_meta" ADD CONSTRAINT "job_listing_meta_job_listing_id_job_listings_id_fk" FOREIGN KEY ("job_listing_id") REFERENCES "job_listings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
