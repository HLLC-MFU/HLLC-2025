import { Card, Skeleton } from "@heroui/react";

const skeletonPairs = 4;

export function ProfileSkeleton() {
    return (
        <Card className="p-4">
            <div className="space-y-4">
                {Array.from({ length: skeletonPairs }).map((_, index) => (
                    <div key={index} className="space-y-1">
                        <Skeleton className="h-4 w-1/3 rounded-lg" /> 
                        <Skeleton className="h-5 w-2/3 rounded-lg" /> 
                    </div>
                ))}
            </div>
        </Card>
    );
}
