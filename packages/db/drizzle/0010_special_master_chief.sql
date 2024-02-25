ALTER TABLE "employees" ALTER COLUMN "primary_skill" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_employee_number_unique" UNIQUE("employee_number");