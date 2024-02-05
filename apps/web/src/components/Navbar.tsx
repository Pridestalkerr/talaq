"use client";
import React, { useCallback } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@nextui-org/react";
import { Users } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

export default function Component() {
  const router = useRouter();
  const logoutQ = api.authRouter.logout.useMutation();

  const onLogout = useCallback(() => {
    logoutQ.mutate(void 0, {
      onSuccess: () => {
        router.push("/");
      },
    });
  }, [logoutQ]);
  return (
    <Navbar shouldHideOnScroll isBordered>
      <NavbarBrand className="gap-2">
        <Users />
        <p className="font-bold text-inherit">SRMap</p>
      </NavbarBrand>
      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        <NavbarItem>
          <Link href="/app/jobs">
            <span className="text-foreground">Jobs</span>
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/app/match">
            <span className="text-foreground">Match</span>
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link href="/app/skills" aria-current="page">
            <span className="text-secondary">Skills</span>
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent as="div" justify="end">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color="secondary"
              name="Jason Hughes"
              size="sm"
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">zoey@example.com</p>
            </DropdownItem>
            <DropdownItem key="logout" color="danger" onClick={() => onLogout()}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}
