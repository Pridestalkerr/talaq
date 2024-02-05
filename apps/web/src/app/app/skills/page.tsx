"use client";
import SkillCard from "@/components/SkillCard";
import { api } from "@/lib/trpc/client";
import { Button, Divider, Input } from "@nextui-org/react";
import { useState } from "react";
import Masonry from "react-masonry-css";

type PageProps = {};

export default function Page(props: PageProps) {
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>("");
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>("");

  const categoriesQ = api.skillsRouter.categories.useQuery(
    {
      search: categorySearchQuery.length > 3 ? categorySearchQuery : undefined,
    },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );
  const categories = categoriesQ.data?.records ?? [];

  const skillsQ = api.skillsRouter.skills.useQuery(
    {
      search: skillSearchQuery.length > 3 ? skillSearchQuery : undefined,
    },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );
  const skills = skillsQ.data?.records ?? [];

  return (
    <div className="flex w-full flex-row gap-4 p-4">
      <div className="flex max-h-[800px] flex-col gap-2 overflow-y-auto border p-2">
        <h4 className="text-xl font-bold">Categories</h4>
        <div className="text-small text-default-foreground flex flex-col gap-1">
          {categories
            .filter((category) => !category.isSubcategory)
            .map((category) => {
              return (
                <div key={category.id} className="flex flex-col gap-4">
                  <span>{category.name}</span>
                </div>
              );
            })}
        </div>
        <Divider className="my-2" />
        <h4 className="text-xl font-bold">Subcategories</h4>
        <div className="text-small text-default-foreground flex flex-col gap-1">
          {categories
            .filter((category) => category.isSubcategory)
            .map((category) => {
              return (
                <div key={category.id} className="flex flex-col gap-4">
                  <span>{category.name}</span>
                </div>
              );
            })}
        </div>
      </div>
      <div className="flex grow flex-col gap-4">
        <Input
          value={skillSearchQuery}
          onChange={(e) => setSkillSearchQuery(e.target.value)}
          placeholder="Search for skills"
        />
        <Masonry
          breakpointCols={4}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {skills.map((skill) => {
            return (
              <SkillCard
                key={skill.id}
                name={skill.name}
                category={skill.category?.name}
                subcategory={skill.subcategory?.name}
                isLanguage={skill.isLanguage}
                isSoftware={skill.isSoftware}
                type={skill.type}
                description={skill.description}
                descriptionUrl={skill.descriptionSource}
              />
            );
          })}
        </Masonry>
      </div>
    </div>
  );
}
