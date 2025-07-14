"use client";
import { useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { NotificationCard } from "./_components/NotificationCard";

export default function NotificationsPage() {
    const [tab, setTab] = useState<"unread" | "read">("unread");

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent px-4">
            <Card className="w-full max-w-xl py-6 px-6 bg-black/20 backdrop-blur-md border border-white rounded-2xl shadow-lg">
                {/* Toggle Tabs with Smooth UI */}
                <div className="flex mb-4 p-1 bg-[#e1dedd] rounded-2xl w-full max-w-sm mx-auto">
                    <button
                        className={`w-1/2 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                            tab === "unread"
                                ? "bg-black text-white shadow-md"
                                : "text-black"
                        }`}
                        onClick={() => setTab("unread")}
                    >
                        Unread
                    </button>
                    <button
                        className={`w-1/2 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                            tab === "read"
                                ? "bg-black text-white shadow-md"
                                : "text-black"
                        }`}
                        onClick={() => setTab("read")}
                    >
                        Read
                    </button>
                </div>

                {/* Notification Cards */}
                <CardBody className="space-y-4 pt-2 px-2 pb-0">
                    {tab === "unread" && (
                        <>
                            <NotificationCard />
                            <NotificationCard />
                        </>
                    )}
                    {tab === "read" && (
                        <>
                            <NotificationCard />
                        </>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
