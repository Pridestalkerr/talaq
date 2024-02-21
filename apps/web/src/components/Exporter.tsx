"use client";

import { RouterOutputs, api, apiVanilla } from "@/lib/trpc/client";
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@nextui-org/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { read, utils, writeFile } from "xlsx";
import { JobMatch, jdLookup, jobCols } from "./shared";
import { ChevronDownIcon } from "lucide-react";
import { toast } from "react-toastify";

type Candidate = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  primarySkill: string;
  cvSkills: string[];
  cvCategories: string[];
};

type Skill = RouterOutputs["uploadRouter"]["getSkillsFromExcerpt"]["record"]["skills"][number];
type Category =
  RouterOutputs["uploadRouter"]["getSkillsFromExcerpt"]["record"]["categories"][number];

type ExporterProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  countrySearch: string;
  primarySkillSearch: string;
  minMatchCount: number;
  cvSkills: Skill[];
  cvCategories: Category[];
};

export default function Exporter(props: ExporterProps) {
  // all of these are optional but helpful
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [primarySkill, setPrimarySkill] = useState("");

  // inherited filters
  const [countrySearch, setCountrySearch] = useState("");
  const [primarySkillSearch, setPrimarySkillSearch] = useState("");
  const [minMatchCount, setMinMatchCount] = useState(1);
  useEffect(() => {
    setCountrySearch(props.countrySearch);
    setPrimarySkillSearch(props.primarySkillSearch);
    setMinMatchCount(props.minMatchCount);
  }, [props.countrySearch, props.primarySkillSearch, props.minMatchCount]);

  // jd metadata
  const [includeJobSkills, setIncludeJobSkills] = useState(true);
  const [includeJobCategories, setIncludeJobCategories] = useState(true);
  const [includeMatchReason, setIncludeMatchReason] = useState(true);

  // exported columns
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(jobCols.map((col) => col.identifier)),
  );

  const handleDownload = useCallback(() => {
    apiVanilla.jobsRouter.export
      .mutate({
        country: countrySearch,
        primarySkill: primarySkillSearch,
        minMatchCount,
        skills: props.cvSkills.map((skill) => skill.id),
      })
      .then((res) => {
        if (!res.records) toast.error("Something went wrong");
        const jobSheet = buildJobsSheet(
          res.records,
          jobCols.filter((col) => visibleColumns.has(col.identifier)),
          {
            includeJobSkills,
            includeJobCategories,
            cvSkills: includeMatchReason ? props.cvSkills : null,
          },
        );
        const candidateSheet = buildCandidateSheet(
          {
            employeeCode,
            firstName,
            lastName,
            primarySkill,
            cvSkills: props.cvSkills.map((skill) => skill.name),
            cvCategories: props.cvCategories.map((cat) => cat.name),
          },
          ["employeeCode", "firstName", "lastName", "primarySkill", "cvSkills", "cvCategories"],
        );

        const wb = utils.book_new();
        utils.book_append_sheet(wb, jobSheet, "Jobs");
        utils.book_append_sheet(wb, candidateSheet, "Candidate");
        writeFile(wb, "sheetjs.xlsx");
      });
  }, [
    props.cvSkills,
    props.cvCategories,
    employeeCode,
    firstName,
    lastName,
    primarySkill,
    countrySearch,
    primarySkillSearch,
    minMatchCount,
    visibleColumns,
  ]);

  return (
    <>
      <Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange} backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <div>
              <ModalHeader>
                <div className="flex flex-col">
                  <span className="text-lg">Export Spreadsheet</span>
                  <span className="text-sm font-normal text-default-500">
                    Please, feel free to use the below options to refine the spreadsheet according
                    to your needs.
                  </span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-row gap-8">
                  <div className="flex flex-col gap-2">
                    <span className="text-medium font-semibold">Jobs</span>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <Input
                          size="sm"
                          variant="underlined"
                          label="Country"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                        />
                        <Input
                          size="sm"
                          variant="underlined"
                          label="Primary Skill"
                          value={primarySkillSearch}
                          onChange={(e) => setPrimarySkillSearch(e.target.value)}
                        />
                        <Input
                          size="sm"
                          variant="underlined"
                          label="Min Match Count"
                          value={String(minMatchCount)}
                          onChange={(e) => setMinMatchCount(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Checkbox
                          checked={includeJobSkills}
                          onChange={(e) => setIncludeJobSkills(e.target.checked)}
                        >
                          Include Job Skills
                        </Checkbox>
                        <Checkbox
                          checked={includeJobCategories}
                          onChange={(e) => setIncludeJobCategories(e.target.checked)}
                        >
                          Include Job Categories
                        </Checkbox>
                        <Checkbox
                          checked={includeMatchReason}
                          onChange={(e) => setIncludeMatchReason(e.target.checked)}
                        >
                          Include Match Reason
                        </Checkbox>
                      </div>
                      <Dropdown backdrop="blur">
                        <DropdownTrigger className="hidden sm:flex">
                          <Button
                            endContent={<ChevronDownIcon className="text-small" />}
                            variant="flat"
                          >
                            Exported Columns
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          className="h-80 overflow-auto"
                          disallowEmptySelection
                          aria-label="Table Columns"
                          closeOnSelect={false}
                          selectedKeys={visibleColumns}
                          selectionMode="multiple"
                          // @ts-expect-error TODO: fix this, its probably correct
                          onSelectionChange={setVisibleColumns}
                        >
                          {jobCols.map((column) => (
                            <DropdownItem key={column.identifier} className="capitalize">
                              {column.name}
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-medium font-semibold">Candidate</span>
                    <span className="text-xs font-semibold">Additional Details</span>
                    <Input
                      size="sm"
                      variant="underlined"
                      label="Employee Code"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                    />
                    <Input
                      size="sm"
                      variant="underlined"
                      label="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                      size="sm"
                      variant="underlined"
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    <Input
                      size="sm"
                      variant="underlined"
                      label="Primary Skill"
                      value={primarySkill}
                      onChange={(e) => setPrimarySkill(e.target.value)}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={() => handleDownload()}>
                  Generate
                </Button>
              </ModalFooter>
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

type SelectedCandidateColumns = (keyof typeof lookupCandidate)[];

const buildCandidateSheet = (candidate: Candidate, selected: SelectedCandidateColumns) => {
  // do the same as below
  return utils.json_to_sheet([
    {
      "Employee Code": candidate.employeeCode,
      "First Name": candidate.firstName,
      "Last Name": candidate.lastName,
      "Primary Skill": candidate.primarySkill,
      "CV Skills": candidate.cvSkills.join(", "),
      "CV Categories": candidate.cvCategories.join(", "),
    },
  ]);
};

type SelectedJobColumns = typeof jobCols;

const buildJobsSheet = (
  jobs: JobMatch[],
  selected: SelectedJobColumns,
  opts: {
    includeJobSkills: boolean;
    includeJobCategories: boolean;
    cvSkills: Skill[] | null;
  },
) => {
  const sheet = [] as Record<string, string>[];
  console.log(selected.map((col) => col.identifier));
  for (const job of jobs) {
    const result = {} as Record<string, string>;
    for (const col of selected) {
      const colId = col.identifier as SelectedJobColumns[number]["identifier"];
      const colName = jdLookup[colId];
      // @ts-expect-error TODO: fix this, it works but it complains about missing prop
      const colVal = col.get(job);
      result[colName] = String(colVal);
    }

    // add skill, categories, and reason for match
    if (opts.includeJobSkills) {
      result["Detected Skills"] = job.skills.join(", ");
    }
    if (opts.includeJobCategories) {
      result["Detected Categories"] = job.categories.join(", ");
    }
    if (opts.cvSkills) {
      const isPresent = (id: string) => {
        return job.skills.some((skill) => skill.id === id);
      };
      result["Match Reason"] = opts.cvSkills
        .map((skill) => {
          return isPresent(skill.id) ? skill.name : null;
        })
        .filter(Boolean)
        .join(", ");
    }

    sheet.push(result);
  }
  return utils.json_to_sheet(sheet);
};

const lookupCandidate = {
  employeeCode: "Employee Code",
  firstName: "First Name",
  lastName: "Last Name",
  primarySkill: "Primary Skill",
  cvSkills: "CV Skills",
  cvCategories: "CV Categories",
} as const;
