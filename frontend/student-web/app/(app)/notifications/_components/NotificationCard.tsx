"use client";

import { Card, Image } from "@heroui/react";
import type { NotificationItem } from "@/types/notification";

interface NotificationCardProps {
    item: NotificationItem;
    onClick?: () => void;
}

export function NotificationCard({ item, onClick }: NotificationCardProps) {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer`}
            role="button"
            tabIndex={0}
            aria-label={`Open notification: ${item.title?.en || "Untitled"}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick?.();
                }
            }}
        >

            <Card
                onClick={onClick}
                className={`w-full bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg px-4 py-3 cursor-pointer transition-opacity duration-200 ${item.isRead ? "opacity-60" : "opacity-100"
                    }`}
            >
                <div className="flex items-start gap-4">
                    <Image
                        src={"/lobby.png"}
                        alt="Notification Icon"
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-white">{item.title?.en ?? "No Topics"}</p>
                            <span className="text-xs text-gray-300">
                                {item.createdAt
                                    ? new Date(item.createdAt).toLocaleTimeString("th-TH", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : "Time not specified"}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">{item.subtitle?.en ?? "No Description"}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
