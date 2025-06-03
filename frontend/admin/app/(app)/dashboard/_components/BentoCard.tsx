import { Card, CardBody, CardHeader, Chip } from "@heroui/react";

export default function BentoCard({
    icon: Icon,
    chip,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    value: number;
    chip?: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="flex-1">
            <CardHeader className="flex items-center justify-between pb-0">
                <div className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center flex">
                    <Icon className="w-6 h-6 text-gray-500" />
                </div>
                {chip && (
                    <Chip className="bg-primary-100 text-primary font-bold" size="sm">{chip}</Chip>
                )
                }
            </CardHeader>
            <CardBody className="pt-0">
                {children}
            </CardBody>
        </Card>
    );
}