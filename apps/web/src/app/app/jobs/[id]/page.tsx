import { api } from "@/lib/trpc/client";
import { RouterOutputs, apiServer } from "@/lib/trpc/rsc";
import { Card, CardBody, CardFooter, CardHeader, Chip, Tooltip } from "@nextui-org/react";
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
      <div className="flex flex-row justify-between gap-12">
        <div className="flex flex-row flex-wrap gap-4">
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
            <span className="text-sm">LoB Details</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.lobDetails}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Reporting Manager</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.reportingManager}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Requisition Status</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.requisitionStatus}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Requisition Source</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.requisitionSource ?? "N/A"}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Domain for INFRA</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.infraDomain ?? "N/A"}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Tag Manager</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.tagManager}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Band</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.band}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Sub Band</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.subBand}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Billing</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.billingType}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">TP1 Interviewer</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.tp1Interviewer}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">TP2 Interviewer</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.tp2Interviewer ?? "N/A"}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Company Code</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.companyCode}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Initiator</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.initiatorId}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">SLA</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.sla}
            </Chip>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm">Ageing</span>
            <Chip size="lg" color="secondary">
              {props.job.meta.agingInDays}
            </Chip>
          </div>
        </div>

        <Card className="min-w-32">
          <CardBody>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Positions</span>
              <div className="flex flex-col">
                <span>Total: {props.job.meta.noOfPositions}</span>
                <span>Balance: {props.job.meta.positionsBalance}</span>
                <span>Actionable: {props.job.meta.actionablePositions}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="p-4">
        <CardHeader>
          <div className="flex w-full flex-col">
            <div className="flex w-full flex-row justify-between">
              <div className="flex flex-col">
                <h4 className="text-3xl font-bold">
                  <WithToolTip tooltip="Designation">
                    <span>{props.job.meta.designation}</span>
                  </WithToolTip>
                  <WithToolTip tooltip="Customer name">
                    <span className="text-default-400"> @{props.job.meta.customerName}</span>
                  </WithToolTip>
                </h4>
                <div className="flex flex-row gap-4">
                  <WithToolTip tooltip="Primary skill">
                    <span className="font-semibold">#{props.job.meta.primarySkill}</span>
                  </WithToolTip>
                </div>
                {props.job.meta.secondarySkill && (
                  <div className="flex flex-row gap-4">
                    <WithToolTip tooltip="Secondary skill">
                      <span className="text-sm font-semibold">#{props.job.meta.primarySkill}</span>
                    </WithToolTip>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold">
                  {props.job.meta.experience}
                  <span className="font-semibold text-default-500"> of experience</span>
                </span>
                <span className="text-lg font-bold">{props.job.meta.country}</span>
              </div>
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

type WithToolTipProps = {
  children: React.ReactNode;
  tooltip: string;
};
const WithToolTip = (props: WithToolTipProps) => {
  return (
    <Tooltip closeDelay={50} content={props.tooltip}>
      {props.children}
    </Tooltip>
  );
};
