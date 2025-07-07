import { Card, CardBody, Skeleton } from "@heroui/react";

export function RoomSkeleton() {
    return (
        <Card className="h-full">
            <CardBody className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                            <Skeleton className="h-4 w-3/4 rounded-lg mb-1" />
                            <Skeleton className="h-3 w-1/2 rounded-lg" />
                        </div>
                    </div>
                    <Skeleton className="w-8 h-8 rounded-md flex-shrink-0" />
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="w-8 h-3 rounded" />
                        <Skeleton className="w-4 h-4 rounded" />
                        <Skeleton className="w-8 h-3 rounded" />
                    </div>
                    <Skeleton className="w-16 h-6 rounded-md" />
                </div>
            </CardBody>
        </Card>
    );
} 