import { Card, CardBody } from "@heroui/react";
import { ReactNode } from "react";

interface Props {
    title?: string;
    description: string;
    icon: ReactNode;
}
export default function SettingsList({ title, description, icon }: Props) {
    return (
        <Card isHoverable isPressable className="justify-between">
            <CardBody>
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r shadow-lg bg-gray-800 border">
                        {icon && <span className="text-white">{icon}</span>}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-start text-sm text-default-500 font-medium">{description}</p>
                    </div>
                </div>
            </CardBody>

        </Card>
    );
}