import { Button } from "@heroui/react";
import { Send } from "lucide-react";

export default function SendNotiButton() {
    return (
        <Button
            isIconOnly
            size="sm"
            variant="flat"
            radius="md"
            className="bg-default-200 text-default-800"
            aria-label="Send Notification"
        >
            <Send className="w-4 h-4" />
        </Button>
    );
}