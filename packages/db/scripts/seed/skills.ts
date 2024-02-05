import { skills as skillsTable, skillCategories } from "../../schemas";
import { db } from "../../src";
import { readFile } from "fs/promises";

interface RootObject {
  attributions: Attribution[];
  data: Data[];
}

interface Attribution {
  name: string;
  text: string;
}

interface Data {
  category: Category;
  description: string;
  descriptionSource: string;
  id: string;
  infoUrl: string;
  isLanguage: boolean;
  isSoftware: boolean;
  name: string;
  subcategory: Subcategory;
  tags: Tag[];
  type: Type;
}

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
}

interface Tag {
  key: string;
  value: string;
}

interface Type {
  id: string;
  name: string;
}

interface RootCategories {
  categories: Category[];
  subcategories: Subcategory[];
}

const readSkills = async () => {
  try {
    // console.log(process.cwd());
    const raw = await readFile("./scripts/static/skills.json", { encoding: "utf8" });
    const data = JSON.parse(raw) as RootObject;
    return data.data;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const readCategories = async () => {
  try {
    const raw = await readFile("./scripts/static/category.json", { encoding: "utf8" });
    const data = JSON.parse(raw) as RootCategories;
    return data;
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const seed = async () => {
  const skills = await readSkills();
  const categories = await readCategories();
  // console.log(categories.categories[0]);
  // console.log(categories.subcategories[0]);
  // console.log(skills[0]);

  const categroriesFromDb = {} as Record<number, string>;

  await db.transaction(async (tx) => {
    // insert categories
    for (const category of categories.categories) {
      const res = await tx
        .insert(skillCategories)
        .values({
          emsiId: category.id,
          name: category.name,
          isSubcategory: false,
        })
        .returning();
      if (res.length === 0 || !res[0]) {
        throw new Error("Expected 1 result");
      }
      categroriesFromDb[category.id] = res[0].id;
    }

    // insert subcategories
    for (const subcategory of categories.subcategories) {
      const res = await tx
        .insert(skillCategories)
        .values({
          emsiId: subcategory.id,
          name: subcategory.name,
          isSubcategory: true,
        })
        .returning();
      if (res.length === 0 || !res[0]) {
        throw new Error("Expected 1 result");
      }
      categroriesFromDb[subcategory.id] = res[0].id;
    }

    // insert skills
    for (const skill of skills) {
      let st: "ST0" | "ST1" | "ST2" | "ST3" | null = null;
      if (skill.type.id === "ST0") {
        st = "ST0";
      } else if (skill.type.id === "ST1") {
        st = "ST1";
      } else if (skill.type.id === "ST2") {
        st = "ST2";
      } else if (skill.type.id === "ST3") {
        st = "ST3";
      } else {
        throw new Error("Unknown skill type");
      }

      const res = await tx
        .insert(skillsTable)
        .values({
          emsiId: skill.id,
          name: skill.name,
          infoUrl: skill.infoUrl,
          description: skill.description,
          descriptionSource: skill.descriptionSource,
          isLanguage: skill.isLanguage,
          isSoftware: skill.isSoftware,
          categoryId: categroriesFromDb[skill.category.id],
          subcategoryId: categroriesFromDb[skill.subcategory.id],
          type: st,
        })
        .returning();
      if (res.length === 0 || !res[0]) {
        console.log("err below: ", res[0]);
        throw new Error("Expected 1 result");
      }
    }
  });
};

seed()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
