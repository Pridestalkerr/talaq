import { RouterOutputs, api } from "@/lib/trpc/client";
import { Autocomplete, AutocompleteItem, Badge, Button, Chip, Input } from "@nextui-org/react";
import { FileCheck2, SearchIcon, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type Skill = RouterOutputs["skillsRouter"]["skills"]["records"][number];

type EmployeeFormProps = {};

export const EmployeeForm = (props: EmployeeFormProps) => {
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  return (
    <div className="flex flex-col gap-4">
      <Button color="secondary">
        <div className="flex flex-row items-center gap-1">
          <FileCheck2 size={16} />
          <span>Fill from CV</span>
        </div>
      </Button>
      <div className="flex flex-row gap-4">
        <Input size="sm" label="First Name" />
        <Input size="sm" label="Last Name" />
      </div>
      <div className="flex flex-row gap-4">
        <Input size="sm" label="Employee Nr" />
        <Input size="sm" label="Band" />
        <Input size="sm" label="Subband" />
      </div>
      <div className="flex flex-row gap-4">
        <Input size="sm" label="Contact Email" />
        <Input size="sm" label="Contact Phone" />
      </div>
      <div className="flex flex-row gap-4">
        <Input size="sm" label="Primary Skill" />
        <Input size="sm" label="Secondary Skill" />
      </div>
      <SkillSelector skills={selectedSkills} onSkillsChange={setSelectedSkills} />
    </div>
  );
};

type SkillSelectorProps = {
  //   initialSkills: string[];
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
};
const SkillSelector = (props: SkillSelectorProps) => {
  const [search, setSearch] = useState<string>("");
  const skillsQ = api.skillsRouter.skills.useQuery(
    {
      search,
      limit: 10,
    },
    {
      enabled: search.length > 2,
    },
  );
  const skills = skillsQ.data?.records ?? [];

  const addItem = useCallback(
    (key: string) => {
      const selected = skills.find((skill) => skill.id === key);
      const newSkills = new Set([...props.skills, selected].filter(Boolean) as Skill[]);
      props.onSkillsChange(Array.from(newSkills));
    },
    [props.skills, props.onSkillsChange],
  );

  const removeItem = useCallback((key: string) => {
    const newSkills = props.skills.filter((skill) => skill.id !== key);
    props.onSkillsChange(newSkills);
  }, []);

  const onSelectionChange = useCallback(
    (key: string) => {
      addItem(key);
      return null;
    },
    [addItem],
  );

  const SelectedZone = useMemo(() => {
    return (
      <div className="flex flex-row flex-wrap gap-1">
        {props.skills.map((skill) => (
          <Chip key={skill.id}>
            <div className="flex flex-row items-center gap-1">
              {skill.name}
              <X size={12} onClick={() => removeItem(skill.id)} cursor="pointer" />
            </div>
          </Chip>
        ))}
      </div>
    );
  }, [props.skills]);

  return (
    <div className="flex flex-col gap-4">
      <Autocomplete
        startContent={<SearchIcon />}
        placeholder="Search for skills"
        size="sm"
        inputValue={search}
        onInputChange={setSearch}
        items={skills}
        selectedKey={null}
        // @ts-expect-error string vs key??
        onSelectionChange={onSelectionChange}
        // onOpenChange={() => {}}
        allowsCustomValue={true}
      >
        {(item) => <AutocompleteItem key={item.id}>{item.name}</AutocompleteItem>}
      </Autocomplete>
      {SelectedZone}
    </div>
  );
};
