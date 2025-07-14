import { Card, Skeleton } from "@heroui/react";

export function SchoolSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, index) => (
                <Card key={index} className="p-4">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="h-6 w-3/4 rounded-lg mb-2" />
                            <Skeleton className="h-4 w-1/2 rounded-lg" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
} 