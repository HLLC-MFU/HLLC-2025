import { Card } from "@heroui/react";

export function NotificationCard() {
    return (
        <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg px-4 py-3 w-full max-w-md">
            <div className="flex items-start gap-4">
                <img
                    src="/lobby.png"
                    alt="Notification Icon"
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                />

                {/* Content */}
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-white">{'{title}'}</p>
                        <span className="text-xs text-gray-300">Now</span>
                    </div>
                    <p className="text-sm text-gray-400">{'{subtitle}'}</p>
                </div>
            </div>
        </Card>
    );
}
