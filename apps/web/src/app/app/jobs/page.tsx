"use client";
import SkillCard from "@/components/SkillCard";
import { RouterOutputs, api } from "@/lib/trpc/client";
import { Button, Divider, Input, ScrollShadow, Spinner } from "@nextui-org/react";
import { ChangeEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import Masonry from "react-masonry-css";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
} from "@nextui-org/react";
import Dropzone from "@/components/Dropzone";
import {
  Trash,
  File,
  SearchIcon,
  ChevronDownIcon,
  PlusIcon,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { z } from "zod";

type Job = RouterOutputs["jobsRouter"]["search"]["records"][number];
type PageProps = {};

const jdSchema = z.object({
  autoReqId: z.string(),
  srNo: z.string(),
  lobDetails: z.string(),
  reportingManager: z.string(),
  requisitionStatus: z.string(),
  tagManager: z.string().nullable(),
  primarySkill: z.string(),
  secondarySkill: z.string().nullable(),
  infraDomain: z.string().nullable(),
  customerName: z.string(),
  band: z.string(),
  subBand: z.string(),
  designation: z.string(),
  experience: z.string().nullable(),
  jobDescription: z.string(),
  jobDescriptionPost: z.string().nullable(),
  country: z.string(),
  requisitionSource: z.string().nullable(),
  billingType: z.string(),
  noOfPositions: z.number().nullable(),
  positionsBalance: z.number().nullable(),
  actionablePositions: z.number().nullable(),
  tp1Interviewer: z.string().nullable(),
  tp2Interviewer: z.string().nullable(),
  companyCode: z.string(),
  initiatorId: z.coerce.string(),
  sla: z.number().nullable(),
  agingInDays: z.number().nullable(),
});

const lookup = {
  autoReqId: "Auto req ID",
  srNo: "SR Number",
  lobDetails: "LoB Details",
  reportingManager: "Reporting Manager [vReportingManager1]",
  requisitionStatus: "Reqisition Status",
  tagManager: "TAG Manager [TAGManager]",
  primarySkill: "Primary Skill",
  secondarySkill: "Secondary Skill",
  infraDomain: "Domain for INFRA",
  customerName: "Customer Name",
  band: "Band [iBandId]",
  subBand: "Sub Band [vSubBandId]",
  designation: "Designation",
  experience: "Experience [iExperienceId]",
  jobDescription: "Job Description",
  jobDescriptionPost: "Job Description (Posting) [JD_ForPosting]",
  country: "Country",
  requisitionSource: "Requisition Source [iRequistionSource]",
  billingType: "Billing Type [iBillingTypeId]",
  noOfPositions: "No. of Positions",
  positionsBalance: "Balance Positions",
  actionablePositions: "Actionable Positions [Vacancies]",
  tp1Interviewer: "TP1 Interveiwer",
  tp2Interviewer: "TP2 Interveiwer",
  companyCode: "Company Code [vcomp_code]",
  initiatorId: "Initiator Id",
  sla: "SLA",
  agingInDays: "Ageing in Days",
} as const satisfies {
  [key in keyof z.infer<typeof jdSchema>]: string;
};

const metaCols = Object.keys(jdSchema.shape).map((key) => {
  const k = key as keyof typeof lookup;
  return {
    name: lookup[k],
    get: (job: Job) => job.meta?.[k] ?? "N/A",
    identifier: k,
  };
});

const columns = [
  ...metaCols,
  { name: "", get: (job: Job) => job.id, identifier: "actions" },
] as const;

const INITIAL_VISIBLE_COLUMNS = [
  "srNo",
  "customerName",
  "designation",
  "primarySkill",
  "country",
  "actions",
] as const satisfies (typeof columns)[number]["identifier"][];

const trim = (title: string, length: number = 15) => {
  if (title.length > length) {
    return `${title.slice(0, length)}...`;
  }
  return `${title}`;
};

export default function Page(props: PageProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const uploadM = api.uploadRouter.fromSheet.useMutation();

  const [file, setFile] = useState<File | null>(null);

  const encodeFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const encoded = reader.result?.toString().replace(/^data:(.*,)?/, "");
        if (encoded) {
          resolve(encoded);
        } else {
          reject("Error encoding file");
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const onSubmit = useCallback(() => {
    if (!file) return;
    encodeFile(file).then((encoded) => {
      uploadM.mutate(
        { sheet: encoded },
        {
          onSuccess: () => {
            jobsQ.refetch();
            toast.success("Sheet uploaded successfully");
          },
          onError: (err) => {
            toast.error(err.message);
          },
        },
      );
    });
  }, [file]);

  // table below =================================

  const [filterValue, setFilterValue] = useState("");
  //   const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));

  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [page, setPage] = useState(1);

  //   const [{ pageIndex, pageSize }, setPagination] = useState<{
  //     pageIndex: number;
  //     pageSize: number;
  //   }>({
  //     pageIndex: 0,
  //     pageSize: 15,
  //   });

  const jobsQ = api.jobsRouter.search.useQuery({
    searchQuery: filterValue.length > 3 ? filterValue : undefined,
    limit: rowsPerPage,
    offset: (page - 1) * rowsPerPage,
  });
  const jobs = jobsQ.data?.records ?? [];
  const totalCount = jobsQ.data?.total ?? 0;

  const clearM = api.jobsRouter.clear.useMutation();
  const onClearJobs = useCallback(() => {
    clearM.mutate(void 0, {
      onSuccess: () => {
        toast.success("Cleared all jobs");
        jobsQ.refetch();
      },
    });
  }, [clearM]);

  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(
        column.identifier as (typeof INITIAL_VISIBLE_COLUMNS)[number],
      ),
    );
  }, [visibleColumns]);

  //   const totalResults = useMemo(() => jobsQ.data?.total ?? 0, [jobsQ.data]);

  const pages = useMemo(() => {
    return jobsQ.data?.total ? Math.ceil(jobsQ.data?.total / rowsPerPage) : 0;
  }, [jobsQ.data, rowsPerPage]);

  const onRowsPerPageChange: ChangeEventHandler<HTMLSelectElement> = useCallback((e) => {
    // setPagination((prev) => ({ ...prev, pageSize: Number(e.target.value) }));
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    if (value) {
      setFilterValue(value);
      //   setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
    // setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const renderCell = useCallback((job: Job, columnKey: (typeof columns)[number]["identifier"]) => {
    const col = columns.find((column) => column.identifier === columnKey);
    const cellValue = col?.get(job);

    switch (columnKey) {
      case "srNo":
        return <p className="text-bold text-small capitalize">{cellValue}</p>;
      case "autoReqId":
        return <p className="text-bold text-small capitalize">{cellValue}</p>;
      case "reportingManager":
        return <p className="text-bold text-small capitalize">{cellValue}</p>;
      case "requisitionStatus":
        return <p className="text-bold text-small capitalize">{cellValue}</p>;
      case "country":
        return <p className="text-bold text-small capitalize">{cellValue}</p>;
      case "actions":
        return (
          <div className="relative flex items-center justify-end gap-2">
            <Dropdown className="border-1 border-default-200 bg-background">
              <DropdownTrigger>
                <Button isIconOnly radius="full" size="sm" variant="light">
                  <MoreVertical className="text-default-400" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem>
                  <Link href={`/app/jobs/${cellValue}`} target="_blank">
                    <div className="flex flex-row items-center gap-1">
                      <span className="text-sm">View</span>
                      <ExternalLink width={16} height={16} />
                    </div>
                  </Link>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search for listings..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown backdrop="blur">
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  Columns
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
                {columns
                  .filter((col) => col.identifier !== "actions")
                  .map((column) => (
                    <DropdownItem key={column.identifier} className="capitalize">
                      {column.name}
                    </DropdownItem>
                  ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-small text-default-400">Total {totalCount} Job Listings</span>
          <label className="flex items-center text-small text-default-400">
            Rows per page:
            <select
              className="bg-transparent text-small text-default-400 outline-none"
              onChange={onRowsPerPageChange}
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="45">45</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [filterValue, visibleColumns, onRowsPerPageChange, onSearchChange, pages]);

  const bottomContent = useMemo(() => {
    return (
      <div className="flex items-center justify-between px-2 py-2">
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
    );
  }, [pages, page]);

  const classNames = useMemo(
    () => ({
      wrapper: ["max-h-[382px]", "max-w-3xl"],
      th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
      td: [
        // changing the rows border radius
        // first
        "group-data-[first=true]:first:before:rounded-none",
        "group-data-[first=true]:last:before:rounded-none",
        // middle
        "group-data-[middle=true]:before:rounded-none",
        // last
        "group-data-[last=true]:first:before:rounded-none",
        "group-data-[last=true]:last:before:rounded-none",
      ],
    }),
    [],
  );

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              {uploadM.isLoading ? (
                <>
                  <ModalHeader className="flex flex-col gap-1"></ModalHeader>
                  <ModalBody className="flex flex-col items-center">
                    <p className="font-semibold">Uploading... Please wait.</p>
                    <p className="text-sm">You can close this tab and check back later.</p>
                    <Spinner />
                  </ModalBody>
                  <ModalFooter></ModalFooter>
                </>
              ) : (
                <>
                  <ModalHeader className="flex flex-col gap-1"></ModalHeader>
                  <ModalBody className="flex flex-col items-center">
                    <Dropzone title="Upload Excel Sheet" file={file} setFile={setFile}></Dropzone>
                  </ModalBody>
                  <ModalFooter>
                    <div className="flex w-[350px] flex-row gap-2">
                      <div className="row flex flex-grow items-center gap-2 border border-solid">
                        <div className="bg-muted flex h-full flex-row items-center px-2">
                          <File className="" />
                        </div>
                        <div className="flex flex-grow flex-col">
                          <p className="text-sm">
                            {file === null ? "No file selected" : trim(file.name)}
                          </p>
                          <p className="text-xs text-primary/80">
                            {file === null ? "No file selected" : file.size / 1000 + " KB"}
                          </p>
                        </div>
                        <button
                          className="cursor-pointer px-2 hover:text-primary-500"
                          disabled={file === null}
                          onClick={() => {
                            setFile(null);
                          }}
                        >
                          <Trash />
                        </button>
                      </div>
                    </div>
                    <Button color="primary" onClick={onSubmit} disabled={uploadM.isLoading}>
                      Submit
                    </Button>
                  </ModalFooter>
                </>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
      <div className="flex w-full flex-col gap-4 p-4">
        <div className="flex flex-row justify-center gap-4">
          <Button color="primary" onPress={onOpen}>
            Upload
          </Button>
          <Button color="danger" onClick={() => onClearJobs()}>
            Clear
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {/* {jobs.map((job) => {
            return <span>{job.title}</span>;
          })} */}
          <Table
            isCompact
            removeWrapper
            aria-label="Example table with custom cells, pagination and sorting"
            bottomContent={bottomContent}
            bottomContentPlacement="outside"
            checkboxesProps={{
              classNames: {
                wrapper: "after:bg-foreground after:text-background text-background",
              },
            }}
            classNames={classNames}
            topContent={topContent}
            topContentPlacement="outside"
          >
            <TableHeader columns={headerColumns}>
              {(column) => (
                <TableColumn
                  key={column.identifier}
                  //   align={column.uid === "actions" ? "center" : "start"}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent={"No Jobs found :("} items={jobs}>
              {(item) => (
                <TableRow key={item.id}>
                  {/* TODO: type this later or see if Key can be inferred */}
                  {/* @ts-expect-error */}
                  {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
