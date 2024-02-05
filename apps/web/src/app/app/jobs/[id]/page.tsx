import { api } from "@/lib/trpc/client";
import { RouterOutputs, apiServer } from "@/lib/trpc/rsc";
import { Card, CardBody, CardFooter, CardHeader, Chip } from "@nextui-org/react";
import { notFound } from "next/navigation";

type PageProps = {
  params: {
    id: string;
  };
};

type Job = NonNullable<RouterOutputs["jobsRouter"]["getById"]["record"]>;
type Skill = Job["skills"][number];
type Category = Job["categories"][number];

export default async function Page(props: PageProps) {
  const jobId = props.params.id;
  try {
    const jobQ = await apiServer((routers) => {
      return routers.jobsRouter.getById.query({ id: props.params.id });
    });
    const job = jobQ.record;

    if (!job) {
      return notFound();
    }

    console.log(job.categories);

    return <Render job={job} />;
  } catch (err) {
    return notFound();
  }
}

type RenderProps = {
  job: Job;
};
const Render = (props: RenderProps) => {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-row gap-4">
        <div className="flex flex-col items-center">
          <span className="text-sm">SR Number</span>
          <Chip size="lg" color="secondary">
            {props.job.meta.srNo}
          </Chip>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm">Auto Req ID</span>
          <Chip size="lg" color="secondary">
            {props.job.meta.autoReqId}
          </Chip>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm">Customer Name</span>
          <Chip size="lg" color="secondary">
            {props.job.meta.customerName}
          </Chip>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm">Reporting Manager</span>
          <Chip size="lg" color="secondary">
            {props.job.meta.reportingManager}
          </Chip>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm">Band</span>
          <Chip size="lg" color="secondary">
            {props.job.meta.band}
          </Chip>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm">Country</span>
          <Chip size="lg" color="secondary">
            {props.job.meta.country}
          </Chip>
        </div>
      </div>
      <Card className="p-4">
        <CardHeader>
          <div className="flex w-full flex-col">
            <div className="flex w-full flex-row justify-between">
              <h4 className="text-3xl font-bold">
                {props.job.meta.designation}
                <span className="text-default-400"> @{props.job.meta.customerName}</span>
              </h4>
              <span className="text-lg font-bold">
                {props.job.meta.experience}
                <span className="font-semibold text-default-500"> of experience</span>
              </span>
            </div>
            <div className="flex flex-row gap-4">
              <span className="font-semibold">#{props.job.meta.primarySkill}</span>
            </div>
          </div>
        </CardHeader>
        <CardBody>{props.job.description}</CardBody>
        <CardFooter className="items-start">
          <div className="flex flex-col gap-4">
            <h4 className="text-xl font-bold">Detected Skills</h4>
            <div className="flex flex-row flex-wrap gap-2">
              {props.job.skills.map((skill) => {
                return <SkillFlag skill={skill}></SkillFlag>;
              })}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-xl font-bold">Detected Categories</h4>
            <div className="flex flex-row flex-wrap gap-2">
              {props.job.categories.map((category) => {
                return <CategoryFlag category={category}></CategoryFlag>;
              })}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

type SkillFlagProps = {
  skill: Skill;
};
const SkillFlag = (props: SkillFlagProps) => {
  return (
    <Card className="flex">
      <CardBody>{props.skill.name}</CardBody>
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
