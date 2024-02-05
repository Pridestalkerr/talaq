"use client";
import { Tooltip, Card, CardHeader, CardBody, CardFooter, Avatar, Button } from "@nextui-org/react";
import { HelpCircle, Languages, TerminalSquare } from "lucide-react";
import WikipediaIcon from "./WikipediaIcon";
import TruncatedParagraph from "./ReadMoreParagraph";
import Link from "next/link";

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

type SkillCardProps = {
  name: string | undefined | null;
  category: string | undefined | null;
  subcategory: string | undefined | null;
  isLanguage: boolean | undefined | null;
  isSoftware: boolean | undefined | null;
  type: string | undefined | null;
  description: string | undefined | null;
  descriptionUrl: string | undefined | null;
};
export default function SkillCard(props: SkillCardProps) {
  return (
    <Card className="max-w-[340px]">
      <CardHeader className="items-start justify-between">
        <div className="flex gap-5">
          <div className="flex flex-col items-start justify-center gap-2">
            <Link href={`${props.descriptionUrl}`} target="_blank">
              <h5 className="font-semibold leading-none text-default-600">{props.name}</h5>
            </Link>

            <div className="flex flex-col items-start justify-center">
              {props.category && (
                <h4 className="text-small tracking-tight text-default-400">#{props.category}</h4>
              )}
              {props.subcategory && (
                <h4 className="text-small tracking-tight text-default-400">#{props.subcategory}</h4>
              )}
            </div>
          </div>
        </div>

        <span>
          {displayTag({
            isLanguage: props.isLanguage!,
            isSoftware: props.isSoftware!,
          })}
        </span>
      </CardHeader>
      <CardBody className="px-3 py-0 text-small text-default-700">
        <TruncatedParagraph text={props.description ?? "This skill has no description."} />
      </CardBody>
      <CardFooter className="gap-3">
        <div className="flex w-full justify-between gap-1">
          <p className="text-small font-semibold text-default-400">{ST(props.type ?? "ST2")}</p>
          {props.descriptionUrl && <WikipediaIcon href={props.descriptionUrl} />}
        </div>
      </CardFooter>
    </Card>
  );
}
