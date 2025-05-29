import { addToast } from "@heroui/react";

interface AddToastProps {
    title: string;
    description: string;
    color?: "primary" | "default" | "secondary" | "success" | "warning" | "danger" | "foreground";
}

export default function AddToast({title, description, color}: AddToastProps) {
    return (
        addToast({
            title: title,
            description: description,
            color: color,
            variant: "solid",
            classNames: {
                base: "text-white",
                title: "text-white",
                description: "text-white",
            },
        })
    )
}
