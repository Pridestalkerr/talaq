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

type PageProps = {};

type Employee = RouterOutputs["employeesRouter"]["search"]["records"][number];

const columns = [
  {
    name: "Employee Number",
    get: (item: Employee) => item.employeeNumber,
    identifier: "employeeNumber",
  },
  { name: "First Name", get: (item: Employee) => item.firstName, identifier: "firstName" },
  { lastName: "Last Name", get: (item: Employee) => item.lastName, identifier: "lastName" },
  { contactEmail: "Email", get: (item: Employee) => item.contactEmail, identifier: "contactEmail" },
  {
    name: "Phone",
    get: (item: Employee) => item.contactPhone,
    identifier: "contactPhone",
  },
  {
    name: "Primary Skill",
    get: (item: Employee) => item.primarySkill,
    identifier: "primarySkill",
  },
  {
    name: "Secondary Skill",
    get: (item: Employee) => item.secondarySkill,
    identifier: "secondarySkill",
  },
  { name: "Band", get: (item: Employee) => item.band, identifier: "band" },
  { name: "Sub Band", get: (item: Employee) => item.subBand, identifier: "subBand" },
  { name: "", get: (item: Employee) => item.id, identifier: "actions" },
] as const;

const INITIAL_VISIBLE_COLUMNS = [
  "employeeNumber",
  "firstName",
  "lastName",
  "contactEmail",
  "contactPhone",
  "primarySkill",
  "secondarySkill",
  "band",
  "subBand",
] as const satisfies (typeof columns)[number]["identifier"][];

export default function Page(props: PageProps) {
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [page, setPage] = useState(1);

  const employeesQ = api.employeesRouter.search.useQuery({
    searchQuery: filterValue.length > 3 ? filterValue : undefined,
    limit: rowsPerPage,
    offset: (page - 1) * rowsPerPage,
  });
  const employees = employeesQ.data?.records ?? [];
  const totalCount = employeesQ.data?.total ?? 0;

  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(
        column.identifier as (typeof INITIAL_VISIBLE_COLUMNS)[number],
      ),
    );
  }, [visibleColumns]);

  const pages = useMemo(() => {
    return totalCount ? Math.ceil(totalCount / rowsPerPage) : 0;
  }, [totalCount, rowsPerPage]);

  const onRowsPerPageChange: ChangeEventHandler<HTMLSelectElement> = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const renderCell = useCallback(
    (item: Employee, columnKey: (typeof columns)[number]["identifier"]) => {
      const col = columns.find((c) => c.identifier === columnKey);
      const cellValue = col?.get(item);

      switch (columnKey) {
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
                    <Link href={`/app/employees/${cellValue}`} target="_blank">
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
    },
    [],
  );

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search for employees..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <Button color="primary" variant="flat" onPress={() => {}}>
            <PlusIcon />
            Add Employee
          </Button>
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
    <div className="flex w-full flex-col gap-4 p-4">
      {/* <div className="flex flex-row justify-center gap-4">
        <Button color="primary" onPress={onOpen}>
          Upload
        </Button>
        <Button color="danger" onClick={() => onClearJobs()}>
          Clear
        </Button>
      </div> */}
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
          <TableBody emptyContent={"No Employees found :("} items={employees}>
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
  );
}
