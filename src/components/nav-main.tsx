"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon | React.ComponentType<any>;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
    status?: string;
  }[];
  dropdownItems?: {
    label: string;
    onClick: () => void;
    icon: LucideIcon | React.ComponentType<any>;
  }[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item, index) => {
          // Si tiene items (submenús), el menú principal es solo un agrupador sin link
          // Si tiene dropdownItems, también es solo un agrupador
          // Solo si no tiene items ni dropdownItems, puede ser un link
          const hasSubItems = item.items && item.items.length > 0;
          const hasDropdownItems = item.dropdownItems && item.dropdownItems.length > 0;
          // Solo puede ser link si NO tiene items y NO tiene dropdownItems
          const shouldBeLink = !hasSubItems && !hasDropdownItems;

          return (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton
                asChild={shouldBeLink}
                isActive={item.isActive}
                tooltip={isCollapsed ? item.title : undefined}
                dropdownItems={item.dropdownItems?.map((dropdownItem) => ({
                  ...dropdownItem,
                  icon: <dropdownItem.icon className="h-5 w-5" />,
                }))}
              >
                {shouldBeLink ? (
                  <Link
                    href={item.url}
                    className="flex items-center gap-2 w-full"
                    onClick={closeMobileSidebar}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </div>
                )}
              </SidebarMenuButton>
              {!isCollapsed && item.dropdownItems && item.dropdownItems.length > 0 && (
                <SidebarMenuSub>
                  {item.dropdownItems.map((dropdownItem, subIndex) => (
                    <SidebarMenuSubItem key={subIndex}>
                      <SidebarMenuSubButton asChild>
                        <button
                          onClick={() => {
                            dropdownItem.onClick();
                            closeMobileSidebar();
                          }}
                          className="flex items-center gap-2 w-full text-slate-300 hover:text-slate-50 active:text-slate-50 focus:text-slate-300"
                        >
                          <dropdownItem.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{dropdownItem.label}</span>
                        </button>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
