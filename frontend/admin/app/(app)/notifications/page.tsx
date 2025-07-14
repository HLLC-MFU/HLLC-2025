import { BellPlus, BellRing } from "lucide-react";

import NotificationList from "./_components/notificationList";

import { PageHeader } from "@/components/ui/page-header";

export default function NotificationsPage() {
    const elements = [{
        title: "Notification Push",
        description: "Create Notification",
        icon: <BellPlus />,
        href: "/notifications/notifications-push"
    }, {
        title: "Notification Management",
        description: "Manage Notification Information",
        icon: <BellRing />,
        href: "/notifications/notifications-management"
    }]

    return (
        <>
            <PageHeader description='Push and manage notifications' icon={<BellRing />} />
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
