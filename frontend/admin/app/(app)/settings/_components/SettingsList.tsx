"use client";
import { Card, CardBody } from "@heroui/react";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";


interface Props {
    title: string;
    description: string;
    icon: ReactNode;
    href: string;
}
export default function SettingsList({ title, description, icon, href }: Props) {
    const router = useRouter();

    return (
        <Card isHoverable isPressable className="border" shadow="none" onPress={() => router.push(href)}>
            <CardBody className="justify-between">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r bg-gray-200 border">
                            {icon && <span className="text-gray-500">{icon}</span>}
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-default-800 tracking-tight">
                                {title}
                            </h1>
                            <p className="text-start text-xs text-default-500">{description}</p>
                        </div>
                    </div>
                    <div>
                        <ChevronRight />
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}