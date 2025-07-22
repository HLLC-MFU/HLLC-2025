'use client'
import { IdCard, SettingsIcon, TabletSmartphoneIcon } from "lucide-react";

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
    }, {
        title: "App Version Setting",
        description: "Get App Version Settings",
        icon: <TabletSmartphoneIcon />,
        href: "/settings/app-versions"
    }]

    return (
        <>
            <PageHeader description='The is Management Page' icon={<SettingsIcon />} />
            <div className="flex flex-col">
                <div className="grid grid-cols-1 gap-3">
                    {elements.map((item, index) => (
                        <SettingsList
                            key={index}
                            description={item.description}
                            href={item.href}
                            icon={item.icon}
                            title={item.title}
                        />
                    ))}
                </div>
                {/* <SettingAccoardion /> */}
            </div>
        </>
    );
}
