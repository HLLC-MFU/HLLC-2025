import { Card, CardBody, CardHeader } from "@heroui/react";
import { Interfaces } from "@/types/interfaces";
import ImageInputField from "./ImageInputField";
import { ReactNode } from "react";

export default function AssetsSection({
    icon,
    title,
    description,
    item,
    onSave,
    interfaces,
}: {
    icon: ReactNode,
    title: string;
    description: string;
    item: { title: string }[];
    onSave: (interfaceData: FormData) => Promise<void>;
    interfaces: Interfaces;
}) {
    return (
        <>
            <Card className="mb-8 p-2">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                            {icon}
                        </div>
                        <div className="flex flex-col items-start">
                            <h2 className="text-xl font-semibold">{title}</h2>
                            <p className="text-sm">{description}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    <ImageInputField
                        item={item}
                        interfaces={interfaces}
                        onSave={onSave}
                    />
                </CardBody>
            </Card>
        </>
    )
}