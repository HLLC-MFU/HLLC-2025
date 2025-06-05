'use client';

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Tooltip } from "@heroui/tooltip";
import { siteConfig } from "@/config/site";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button, Divider, Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import clsx from "clsx";
import { usePathname } from "next/navigation";

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed.toString());
  }, [collapsed]);

  return (
    <>
      {/* Mobile Toggle Button */}
      {/* <Button
        isIconOnly
        variant="flat"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onPress={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
      </Button> */}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static h-screen bg-default-50 border-r flex flex-col overflow-hidden transition-all duration-200 ease-in-out z-40",
          collapsed ? "w-16" : "w-64",
          isMobileOpen ? "left-0" : "-left-full lg:left-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Avatar
                size="sm"
                src="/logo.png"
                className="w-8 h-8"
              />
              <span className="font-semibold text-default-900">HLLC Admin</span>
            </div>
          )}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setCollapsed((prev) => !prev)}
            className="ml-auto hidden lg:flex"
          >
            {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {siteConfig.navMenuItems.map((section) => (
            <div key={section.section} className="space-y-1">
              {!collapsed && (
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                    {section.section}
                  </p>
                </div>
              )}
              <div className="space-y-1 px-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Tooltip
                      key={item.href}
                      content={collapsed ? item.label : ""}
                      placement="right"
                      className={clsx(collapsed ? "block" : "invisible")}
                    >
                      <NextLink
                        href={item.href}
                        className={clsx(
                          "relative flex items-center gap-3 p-2 rounded-md transition-all duration-200 ease-in-out",
                          collapsed ? "justify-center" : "justify-start",
                          isActive
                            ? "bg-primary-50 text-primary font-semibold"
                            : "hover:bg-default-100 text-default-700"
                        )}
                      >
                        <span
                          className={clsx(
                            "absolute left-0 top-0 h-full w-1 rounded-r-md transition-all duration-200 ease-in-out",
                            isActive ? "bg-primary" : "bg-transparent"
                          )}
                        />
                        <Icon className={clsx(
                          "w-5 h-5 z-10",
                          isActive ? "text-primary" : "text-default-500"
                        )} />
                        {!collapsed && (
                          <span className="text-sm z-10">{item.label}</span>
                        )}
                      </NextLink>
                    </Tooltip>
                  );
                })}
              </div>
              {!collapsed && <Divider className="my-4" />}
            </div>
          ))}
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t p-4">
            <Dropdown placement="top-start">
              <DropdownTrigger>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-default-100 p-2 rounded-md transition-colors">
                  <Avatar
                    size="sm"
                    src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
                    className="w-8 h-8"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">John Doe</span>
                    <span className="text-xs text-default-500">Administrator</span>
                  </div>
                </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem key="profile">Profile</DropdownItem>
                <DropdownItem key="settings">Settings</DropdownItem>
                <DropdownItem key="logout" className="text-danger" color="danger">
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        )}
      </aside>
    </>
  );
};