import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  varchar,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const STEnum = pgEnum("ST_enum", ["ST0", "ST1", "ST2", "ST3"]);

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  emsiId: text("emsi_id").unique().notNull(),
  name: text("name").notNull(),
  infoUrl: text("info_url"),
  description: text("description"),
  descriptionSource: text("description_source"),
  isLanguage: boolean("is_language").notNull(),
  isSoftware: boolean("is_software").notNull(),
  categoryId: uuid("category_id").references(() => skillCategories.id, {
    onDelete: "set null",
  }),
  subcategoryId: uuid("subcategory_id").references(() => skillCategories.id, {
    onDelete: "set null",
  }),
  type: text("type").$type<"ST0" | "ST1" | "ST2" | "ST3">(),
});

export const skillCategories = pgTable("skill_categories", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  name: text("name").notNull(),
  emsiId: integer("emsi_id").unique().notNull(), // categories go up to id=17, subcategories are 3 digits
  isSubcategory: boolean("is_subcategory").notNull(),
});

export const skillsRelations = relations(skills, ({ one }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
  subcategory: one(skillCategories, {
    fields: [skills.subcategoryId],
    references: [skillCategories.id],
  }),
}));

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  isAdmin: boolean("is_admin").default(false),
});
export const providers = pgEnum("providers", ["EMAIL"]);
export const authKey = pgTable(
  "auth_key",
  {
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    provider: providers("provider").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    hashedPassword: text("hashed_password"),
    verified: boolean("verified").default(false),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.provider, table.providerUserId],
      }),
    };
  },
);

export const timestampTZ = (
  name: Parameters<typeof timestamp>[0],
  config?: Parameters<typeof timestamp>[1],
) => {
  return timestamp(name, {
    ...config,
    withTimezone: true,
    precision: 3,
    mode: "date",
  });
};

export const session = pgTable("session", {
  id: varchar("id", {
    length: 40,
  }).notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onUpdate: "cascade" }),
  csrfToken: varchar("csrf_token", { length: 255 }), // leave nullable for now
  activeExpires: timestampTZ("active_expires").notNull(),
  idleExpires: timestampTZ("idle_expires").notNull(),
});

export const userRelations = relations(users, ({ many, one }) => {
  return {
    keys: many(authKey),
    sessions: many(session),
    authKeys: many(authKey),
  };
});

export const authKeyRelations = relations(authKey, ({ one }) => {
  return {
    user: one(users, {
      fields: [authKey.userId],
      references: [users.id],
    }),
  };
});

export const sessionRelations = relations(session, ({ one }) => {
  return {
    user: one(users, {
      fields: [session.userId],
      references: [users.id],
    }),
  };
});

export const jobListings = pgTable("job_listings", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skills: uuid("skills")
    .references(() => skills.id)
    .array()
    .default(sql`ARRAY[]::uuid[]`),
  categories: uuid("categories")
    .references(() => skillCategories.id)
    .array()
    .default(sql`ARRAY[]::uuid[]`),
});

// change this when needed
export const jobListingMeta = pgTable("job_listing_meta", {
  jobListingId: uuid("job_listing_id")
    .references(() => jobListings.id)
    .notNull(),
  autoReqId: varchar("auto_req_id", { length: 255 }).notNull(),
  srNo: varchar("sr_no", { length: 255 }).notNull(),
  reportingManager: varchar("reporting_manager", { length: 255 }),
  requisitionStatus: varchar("requisition_status", { length: 255 }),
  recruiter: varchar("recruiter", { length: 255 }),
  primarySkill: varchar("primary_skill", { length: 255 }),
  customerName: varchar("customer_name", { length: 255 }),
  designation: varchar("designation", { length: 255 }),
  experience: varchar("experience", { length: 255 }),
  jobDescription: text("job_description"),
  jobDescriptionPost: text("job_description_post"),
  band: varchar("band", { length: 255 }),
  country: varchar("country", { length: 255 }),
});

export const jobListingRelations = relations(jobListings, ({ one }) => {
  return {
    meta: one(jobListingMeta, {
      fields: [jobListings.id],
      references: [jobListingMeta.autoReqId],
    }),
  };
});
