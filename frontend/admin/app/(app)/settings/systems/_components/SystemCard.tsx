import {
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Divider,
    Switch,
} from "@heroui/react";
import { Building2, LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { System } from "@/types/system";

interface SystemCardProps {
    system: System;
    onClick: (system: System) => void;
    
}

export function SystemCard({ system, onClick }: SystemCardProps) {
    return (
        <Card isHoverable className="h-full" key={system._id + system.status}>
            <CardHeader className="flex gap-3 p-4">
                <div className="flex flex-col items-start min-w-0 text-start">
                    <p className="text-lg font-semibold truncate w-full">
                        {system.status ? "Active" : "Inactive"}
                    </p>
                </div>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4 p-4">
                <div className="flex items-center gap-2">
                    <Building2 className="text-default-500 flex-shrink-0" size={16} />
                    <span className="text-sm text-default-500 truncate">
                        {system.status ? "Active" : "Inactive"}
                    </span>
                </div>
            </CardBody>
            <Divider />
            <CardFooter className="flex justify-between p-4">
                <Switch
                    isSelected={system.status}
                    color="success"
                    endContent={<LockKeyholeOpen/>}
                    size="lg"
                    startContent={<LockKeyhole/>}
                    onValueChange={() => onClick(system)}
                />
            </CardFooter>
        </Card>
    );
}
