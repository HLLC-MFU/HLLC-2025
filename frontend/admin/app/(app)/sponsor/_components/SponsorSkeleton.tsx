import { Card, Skeleton } from "@heroui/react";

export function SponsorSkeleton() {
    return (
        <Card className="p-4">
            <div className="flex items-center space-x-4">
                <Skeleton className="w-12 h-12 rounded-lg"/>
                <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 rounded-lg mb-2"/>
                    <Skeleton className="h-4 w-1/2 rounded-lg"/>
                </div>
            </div>
        </Card>
    );
}