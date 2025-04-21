'use client';

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { Tooltip } from "@heroui/tooltip";
import { siteConfig } from "@/config/site";
import { MenuIcon, XIcon } from "lucide-react";
import { Button, Divider } from "@heroui/react";
import clsx from "clsx";

export const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) {
            setCollapsed(saved === "true");
        }
    }, []);

    // Save collapsed state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("sidebar-collapsed", collapsed.toString());
    }, [collapsed]);

    return (
        <motion.aside
            animate={{ width: collapsed ? 64 : 260 }}
            className="h-screen bg-default-50 border-r flex flex-col overflow-hidden"
            transition={{ duration: 0.3, type: "tween" }}
        >
            <div className="flex items-center justify-between p-4">
                {/* {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2"
          >
          </motion.div>
        )} */}
                <Button onPress={() => setCollapsed((prev) => !prev)} isIconOnly>
                    {collapsed ? (
                        <MenuIcon className="w-5 h-5" />
                    ) : (
                        <XIcon className="w-5 h-5" />
                    )}
                </Button>
            </div>

            <ul className="flex-1 px-2 space-y-4 overflow-y-auto py-2">
                {siteConfig.navMenuItems.map((section) => (
                    <div key={section.section} className="space-y-1">
                        <Divider className="my-4" />
                        {!collapsed && (
                            <p className="text-xs font-semibold text-default-500 px-2 uppercase">
                                {section.section}
                            </p>
                        )}

                        {section.items.map((item) => {
                            const Icon = item.icon;
                            return (   
                                <Tooltip
                                    key={item.href}
                                    content={collapsed ? item.label : ""}
                                    placement="right"
                                    className={clsx(collapsed ? "block" : "invisible")}
                                >
                                    <li>
                                        <NextLink
                                            href={item.href}
                                            className={clsx(
                                                "flex items-center gap-3 p-2 rounded-md hover:bg-default-200 transition-colors items-center",
                                                collapsed ? "justify-center" : "justify-start"
                                            )}
                                        >
                                            <Icon className="w-5 h-5 text-default-700" />
                                            {!collapsed && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className=" text-default-700 text-sm"
                                                >
                                                    {item.label}
                                                </motion.p>
                                            )}
                                        </NextLink>
                                    </li>
                                </Tooltip>
                            );
                        })}

                    </div>
                ))}
            </ul>
        </motion.aside>
    );
};
