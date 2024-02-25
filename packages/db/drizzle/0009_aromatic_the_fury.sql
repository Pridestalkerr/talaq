CREATE TABLE IF NOT EXISTS "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(20),
	"employee_number" varchar(50) NOT NULL,
	"skills" uuid[] DEFAULT ARRAY[]::uuid[],
	"categories" uuid[] DEFAULT ARRAY[]::uuid[],
	"primary_skill" varchar(255) NOT NULL,
	"secondary_skill" varchar(255),
	"band" varchar(30) NOT NULL,
	"sub_band" varchar(30) NOT NULL
);
