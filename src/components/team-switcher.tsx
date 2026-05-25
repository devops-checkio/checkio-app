"use client";

import { ChevronsUpDown } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCookieSession } from "@/context/useCookieSession";
import { useEffect } from "react";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    id: string;
    name: string;
    logo: any;
    plan: string;
  }[];
}) {
  const { companyId, updateCompanyId } = useCookieSession();
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(
    teams.find((team) => team.id === companyId) || teams[0]
  );

  useEffect(() => {
    if (!companyId && teams.length > 0) {
      updateCompanyId(teams[0].id);
      setActiveTeam(teams[0]);
    } else if (companyId) {
      const team = teams.find((t) => t.id === companyId);
      if (team) {
        setActiveTeam(team);
      }
    }
  }, [companyId, teams, updateCompanyId]);

  const handleTeamChange = (team: any) => {
    setActiveTeam(team);
    updateCompanyId(team.id);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-10"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white border border-gray-200">
                {activeTeam?.logo}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-sm">
                  {activeTeam?.name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Empresas
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleTeamChange(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  {team.logo}
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
