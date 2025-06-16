"use client"
import { Target } from "@/types/Notification";
import { Card, Image } from "@heroui/react";
import { Notification } from '@/types/Notification';
import { useMemo } from "react";

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

const statusColorMap: Record<string, { bg: string, text: string }> = {
    global: { bg: "bg-green-100", text: "text-green-800" },
    school: { bg: "bg-blue-100", text: "text-blue-800" },
    major: { bg: "bg-gray-100", text: "text-gray-800" },    
    individual: { bg: "bg-yellow-100", text: "text-yellow-800" },
};

type FormatNotification = {
    id: string
    title: string
    subtitle: string
    image?: string
    redirectButton?: string
    scope: 'global' | Target[]
}

interface NotificationCardprop {
    notification: Notification[]
}

export default function NotificationCard({ notification }: NotificationCardprop) {

    const formatted = useMemo<FormatNotification[]>(() => {
        return (Array.isArray(notification) ? notification : []).map(item => {
            return {
                id: item._id,
                title: item.title.en,
                subtitle: item.subtitle.en,
                image: item?.image,
                redirectButton: item?.redirectButton?.label.en,
                scope: item.scope
            };
        });
    }, [notification]);


    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-8 w-full sm:justify-center sm:items-center">
            {formatted.map(item => (
                <Card key={item.id} className=" rounded-2xl overflow-hidden shadow-md">
                    <Image
                        alt="Card background"
                        className="object-cover w-full h-40" // ปรับขนาดตรงนี้
                        src={item?.image?.trim()
                            ? `http://localhost:8080/uploads/${item.image}`
                            : "/placehole.png"
                        }
                        width={500}
                        height={160}
                    />
                    <div className="p-4 w-full">
                        <div className="mb-2 flex flex-wrap gap-3">
                            {Array.isArray(item.scope) ? item.scope.map((t, idx) => {
                                const type = t.type.toLowerCase();
                                const color = statusColorMap[type];
                                return (
                                    <span
                                        key={idx}
                                        className={`${color.bg} ${color.text} text-xs font-semibold px-2.5 py-0.5 rounded`}
                                    >
                                        {capitalize(type)}
                                    </span>
                                )
                            }) : (() => {
                                const type = item.scope.toLowerCase();
                                const color = statusColorMap[type];
                                return (
                                    <span
                                        className={`${color.bg} ${color.text} text-xs font-semibold px-2.5 py-0.5 rounded`}
                                    >
                                        {capitalize(type)}
                                    </span>
                                )
                            })()
                            }
                            {item.redirectButton && (
                                <span className={`bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-0.5 rounded`}>
                                    Link
                                </span>
                            )}
                        </div>
                        <h4 className="font-bold text-lg">{capitalize(item.title)}</h4>
                        <p className="text-sm text-gray-600">{capitalize(item.subtitle)}</p>
                    </div>
                </Card>
            ))}
        </div>
    )
}
