'use client'
import { IdCard, SettingsIcon } from "lucide-react";

import SettingsList from "./_components/SettingsList";

import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
    const elements = [{
        title: "Permissions Setting",
        description: "Get Permissions Settings",
        icon: <IdCard />,
        href: "/settings/role-permissions"
    }, {
        title: "System Setting",
        description: "Get System Settings",
        icon: <SettingsIcon />,
        href: "/settings/systems"
    }]
    return (
        <>
            <PageHeader description='The is Management Page' icon={<SettingsIcon />} />
            <div className="flex flex-col">
                <div className="grid grid-cols-1 gap-3">
                    {elements.map((item, index) => (
                        <SettingsList
                            key={index}
                            title={item.title}
                            description={item.description}
                            icon={item.icon}
                            href={item.href}
                        />
                    ))}
                </div>
                {/* <SettingAccoardion /> */}
            </div>
        </>
    );
}
