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
import { usePathname, useRouter } from "next/navigation";

export default function Component() {
  const router = useRouter();
  const pathname = usePathname();
  const logoutQ = api.authRouter.logout.useMutation();
  const meQ = api.authRouter.me.useQuery();

  const onLogout = useCallback(() => {
    logoutQ.mutate(void 0, {
      onSuccess: () => {
        router.push("/");
      },
    });
  }, [logoutQ]);

  const isActive = useCallback(
    (href: string) => {
      return pathname === href;
    },
    [pathname],
  );

  const ariaCurrent = useCallback(
    (href: string) => {
      return isActive(href) ? "page" : undefined;
    },
    [isActive],
  );

  const className = useCallback(
    (href: string) => {
      return isActive(href) ? "text-secondary" : "text-foreground";
    },
    [isActive],
  );

  return (
    <Navbar shouldHideOnScroll isBordered>
      <NavbarBrand className="gap-2">
        <Users />
        <p className="font-bold text-inherit">SRMap</p>
      </NavbarBrand>
      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        <NavbarItem isActive={isActive("/app/jobs")}>
          <Link href="/app/jobs" aria-current={ariaCurrent("/app/jobs")}>
            <span className={className("/app/jobs")}>Jobs</span>
          </Link>
        </NavbarItem>
        <NavbarItem isActive={isActive("/app/match")}>
          <Link href="/app/match" aria-current={ariaCurrent("/app/match")}>
            <span className={className("/app/match")}>Match</span>
          </Link>
        </NavbarItem>
        <NavbarItem isActive={isActive("/app/skills")}>
          <Link href="/app/skills" aria-current={ariaCurrent("/app/skills")}>
            <span className={className("/app/skills")}>Skills</span>
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
              <p className="font-semibold">{meQ.data?.record?.email}</p>
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
