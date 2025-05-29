import { addToast, Button } from "@heroui/react";
import { Bell, Send, X } from "lucide-react";

export default function SendNotiButton() {
    return (
        <>
            <Button
                isIconOnly
                size="sm"
                variant="flat"
                radius="md"
                className="bg-default-200 text-default-800"
                aria-label="Send Notification"
                onPress={() => {
                    addToast({
                        hideIcon: true,
                        title: "Notification Sent Successfully",
                        description: "Your notification has been sent successfully.",
                        color: "success",
                        // endContent: <X />,
                        timeout: 5000,
                        shouldShowTimeoutProgress: true,
                        classNames: {
                            base: "fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xs sm:left-auto sm:right-6 sm:translate-x-0 sm:max-w-sm z-[9999]",
                            closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                        },
                        closeIcon: (
                            <svg
                                fill="none"
                                height="32"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                width="32"
                            >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        ),
                    });
                }}
            >
                <Bell className="w-4 h-4" />
            </Button >
        </>
    );
}