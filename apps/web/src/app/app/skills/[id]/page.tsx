import { RouterOutputs, apiServer } from "@/lib/trpc/rsc";
import { Card, CardBody, CardFooter, CardHeader, Chip, Link, Tooltip } from "@nextui-org/react";
import { HelpCircle, Languages, TerminalSquare } from "lucide-react";
import { notFound } from "next/navigation";

type PageProps = {
  params: {
    id: string;
  };
};

type Skill = NonNullable<RouterOutputs["skillsRouter"]["getById"]["record"]>;

export default async function Page(props: PageProps) {
  const skillId = props.params.id;
  try {
    const skillQ = await apiServer((routers) => {
      return routers.skillsRouter.getById.query({ id: skillId });
    });
    const skill = skillQ.record;

    if (!skill) {
      return notFound();
    }

    return <Render skill={skill} />;
  } catch (err) {
    return notFound();
  }
}

type RenderProps = {
  skill: Skill;
};
const Render = (props: RenderProps) => {
  return (
    <div className="flex flex-col gap-8 px-56 py-8">
      <Card className="p-4">
        <CardHeader>
          <div className="flex w-full flex-col">
            <div className="flex w-full flex-row justify-between">
              <h4 className="text-3xl font-bold">{props.skill.name}</h4>
              <span>
                {displayTag({
                  isLanguage: props.skill.isLanguage!,
                  isSoftware: props.skill.isSoftware!,
                })}
              </span>
            </div>
            <div className="flex flex-row gap-4">
              <span className="font-semibold">#{props.skill.category?.name}</span>
            </div>
            <span className="font-semibold">#{props.skill.subcategory?.name}</span>
          </div>
        </CardHeader>
        <CardBody>{props.skill.description}</CardBody>
        <CardFooter className="items-start">
          <div className="flex w-full justify-between gap-1">
            <p className="text-small font-semibold text-default-400">
              {ST(props.skill.type ?? "ST2")}
            </p>
            {props.skill.descriptionSource && (
              <Link href={props.skill.descriptionSource!} target="_blank">
                Learn more
              </Link>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

const softwareTag = () => {
  return (
    <Tooltip content="Software or technical skill">
      <TerminalSquare />
    </Tooltip>
  );
};

const languageTag = () => {
  return (
    <Tooltip content="Language skill">
      <Languages />
    </Tooltip>
  );
};

const otherTag = () => {
  return (
    <Tooltip content="General skill">
      <HelpCircle />
    </Tooltip>
  );
};

export const displayTag = ({
  isLanguage,
  isSoftware,
}: {
  isLanguage: boolean;
  isSoftware: boolean;
}) => {
  if (isLanguage) {
    return languageTag();
  } else if (isSoftware) {
    return softwareTag();
  } else {
    return otherTag();
  }
};

const ST = (val: string) => {
  if (val === "ST1") {
    return (
      <Tooltip content='Skills that are primarily required within a subset of occupations or equip one to perform a specific task (e.g. "NumPy" or "Hotel Management"). Also known as technical skills or specialized skills.'>
        <span>Specialized Skill</span>
      </Tooltip>
    );
  } else if (val === "ST2") {
    return (
      <Tooltip content='Skills that are prevalent across many different occupations and industries, including both personal attributes and learned skills. (e.g. "Communication" or "Microsoft Excel"). Also known as soft skills, human skills, and competencies.'>
        <span>Common Skill</span>
      </Tooltip>
    );
  } else if (val === "ST3") {
    return (
      <Tooltip content="Certification skills are recognizable qualification standards assigned by industry or education bodies.">
        <span>Certification</span>
      </Tooltip>
    );
  } else {
    return null;
  }
};
