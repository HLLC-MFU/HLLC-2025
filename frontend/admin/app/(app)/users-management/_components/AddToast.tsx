import { addToast } from "@heroui/react";

interface AddToastProps {
    title: string;
    description: string;
}

export default function AddToast({title, description}: AddToastProps) {
    return (
        addToast({
            title: title,
            description: description,
            color: "success",
            variant: "solid",
            classNames: {
                base: "text-white",
                title: "text-white",
                description: "text-white",
            },
        })
    )
}
