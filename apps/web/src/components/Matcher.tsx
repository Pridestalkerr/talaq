"use client";

import { api } from "@/lib/trpc/client";
import { RouterOutputs } from "@acme/api";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Input,
  Pagination,
} from "@nextui-org/react";
import { Languages, Laptop2, SearchIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import TruncatedParagraph from "./ReadMoreParagraph";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

type Skill = RouterOutputs["uploadRouter"]["getSkillsFromExcerpt"]["record"]["skills"][number];
type Category =
  RouterOutputs["uploadRouter"]["getSkillsFromExcerpt"]["record"]["categories"][number];
type MatcherProps = {
  skills: Skill[];
  categories: Category[];
  reset: () => void;
};
export default function Matcher(props: MatcherProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [primarySkillSearch, setPrimarySkillSearch] = useState("");

  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [page, setPage] = useState(1);

  const matchesQ = api.jobsRouter.match.useQuery(
    {
      country: countrySearch.length > 3 ? countrySearch : undefined,
      primarySkill: primarySkillSearch.length > 3 ? primarySkillSearch : undefined,
      skills: props.skills.map((skill) => skill.id),
      limit: rowsPerPage,
      offset: (page - 1) * rowsPerPage,
    },
    {
      staleTime: Infinity,
    },
  );
  const matches = matchesQ.data?.records ?? [];
  const totalCount = matchesQ.data?.records[0]?.totalcount ?? 0;

  const pages = useMemo(() => {
    return totalCount ? Math.ceil(totalCount / rowsPerPage) : 0;
  }, [matchesQ.data, rowsPerPage]);

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex flex-row gap-4">
        <div className="flex flex-grow flex-col gap-2">
          <div className="flex flex-row flex-wrap gap-2">
            {props.skills.map((skill) => (
              <SkillFlag key={skill.id} skill={skill} />
            ))}
          </div>
          <div className="flex flex-row flex-wrap gap-x-4 text-default-400">
            {props.categories.map((category) => (
              <span>#{category.name}</span>
            ))}
          </div>
        </div>
        <Button color="warning" size="lg" onPress={() => props.reset()}>
          Reset
        </Button>
      </div>
      <Divider />
      <div className="flex flex-row gap-12">
        <div className="flex flex-grow flex-col">
          <h4 className="text-2xl font-bold">Matches</h4>
          <span className="text-small text-default-400">Total {totalCount} Job Listings</span>
        </div>
        <Input
          variant="underlined"
          isClearable
          className="max-w-56"
          placeholder="Force Primary Skill match"
          startContent={<SearchIcon />}
          value={primarySkillSearch}
          onClear={() => setPrimarySkillSearch("")}
          onValueChange={setPrimarySkillSearch}
        />
        <Input
          variant="underlined"
          isClearable
          className="max-w-56"
          placeholder="Filter by country"
          startContent={<SearchIcon />}
          value={countrySearch}
          onClear={() => setCountrySearch("")}
          onValueChange={setCountrySearch}
        />
      </div>
      {matches.length > 0 ? (
        <div className="flex flex-col gap-8">
          {matches.map((match) => {
            return (
              <Card className="p-2">
                <CardHeader>
                  <div className="flex w-full flex-col">
                    <div className="flex w-full flex-row justify-between">
                      <div className="flex flex-col items-start">
                        <Link href={`/app/jobs/${match.id}`} target="_blank">
                          <h4 className="text-xl font-bold">
                            {match.meta.designation}
                            <span className="text-default-400"> @{match.meta.customerName}</span>
                          </h4>
                        </Link>
                        <div className="flex flex-row gap-4">
                          <span className="font-semibold">
                            <WithHighlight
                              text={`#${match.meta.primarySkill}`}
                              highlight={primarySkillSearch}
                            />
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold">
                          {match.meta.experience}
                          <span className="font-semibold text-default-500"> of experience</span>
                        </span>
                        <span className="font-bold">
                          <WithHighlight text={match.meta.country} highlight={countrySearch} />
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <TruncatedParagraph text={match.meta.jobDescription ?? ""} />
                </CardBody>
                <CardFooter>
                  <MatchedSkills present={props.skills} skills={match.skills} />
                </CardFooter>
              </Card>
            );
          })}
          <div>
            {pages > 0 ? (
              <Pagination
                isCompact
                showControls
                showShadow
                classNames={{
                  cursor: "bg-foreground text-background",
                }}
                color="default"
                page={page}
                total={pages}
                variant="light"
                onChange={(page) => {
                  // setPagination((prev) => ({ ...prev, pageIndex: page - 1 }));
                  setPage(page);
                }}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h4 className="text-xl font-bold">No matches found</h4>
          <span className="text-default-400">Try adding more skills or refine your search.</span>
        </div>
      )}
    </div>
  );
}

type SkillFlagProps = {
  skill: Skill;
  matched?: boolean;
};
const SkillFlag = (props: SkillFlagProps) => {
  return (
    <Card
      className={cn({
        "bg-success-400": props.matched,
      })}
    >
      <CardBody>
        <Link
          href={`/app/skills/${props.skill.id}`}
          target="_blank"
          className="flex flex-row items-center gap-1"
        >
          {props.skill.name}
          {props.skill.isSoftware && (
            <Laptop2 width={18} height={18} className="text-default-500" />
          )}
          {props.skill.isLanguage && (
            <Languages width={18} height={18} className="text-default-500" />
          )}
        </Link>
      </CardBody>
    </Card>
  );
};

type CategoryFlagProps = {
  category: Category;
};
const CategoryFlag = (props: CategoryFlagProps) => {
  return (
    <Card className="flex">
      <CardBody>{props.category.name}</CardBody>
    </Card>
  );
};

type MatchedSkillsProps = {
  present: Skill[];
  skills: Skill[];
};
const MatchedSkills = (props: MatchedSkillsProps) => {
  const isPresent = useCallback(
    (id: string) => {
      return props.present.some((skill) => skill.id === id);
    },
    [props],
  );
  return (
    <div className="flex flex-row flex-wrap gap-2">
      {props.skills.map((skill) => {
        return <SkillFlag skill={skill} matched={isPresent(skill.id)}></SkillFlag>;
      })}
    </div>
  );
};

type WithHighlightProps = {
  text: string;
  highlight: string;
};
const WithHighlight = (props: WithHighlightProps) => {
  const parts = props.text.split(new RegExp(`(${props.highlight})`, "gi"));
  return (
    <span>
      {parts.map((part, index) => (
        <span
          key={index}
          className={part.toLowerCase() === props.highlight.toLowerCase() ? "bg-warning-400" : ""}
        >
          {part}
        </span>
      ))}
    </span>
  );
};
