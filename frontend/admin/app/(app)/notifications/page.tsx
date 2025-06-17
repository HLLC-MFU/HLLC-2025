'use client'
import { BellDot, BellRing, SettingsIcon } from "lucide-react";

import NotificationList from "./_components/notificationList";

import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
    const elements = [{
        title: "Notification Management",
        description: "Manage Notification Information",
        icon: <BellRing />,
        href: "/notifications/notifications-management"
    }, {
        title: "Notification Push",
        description: "Create Notification",
        icon: <BellDot />,
        href: "/notifications/notifications-push"
    }]

    return (
        <>
            <PageHeader description='The is Management Page' icon={<SettingsIcon />} />
            <div className="flex flex-col">
                <div className="grid grid-cols-1 gap-3">
                    {elements.map((item, index) => (
                        <NotificationList
                            key={index}
                            description={item.description}
                            href={item.href}
                            icon={item.icon}
                            title={item.title}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
