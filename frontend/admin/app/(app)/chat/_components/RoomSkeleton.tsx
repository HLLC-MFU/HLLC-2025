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

// Generic skeleton for different layouts
export function GenericSkeleton({ 
    type = "card", 
    rows = 1, 
    className = "bg-default-50 rounded-xl shadow-sm border border-default-200 overflow-hidden"
}: { 
    type?: "card" | "list" | "table";
    rows?: number;
    className?: string;
}) {
    switch (type) {
        case "list":
            return (
                <div className={`space-y-3 ${className}`}>
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-3/4 rounded-lg mb-2" />
                                <Skeleton className="h-3 w-1/2 rounded-lg" />
                            </div>
                            <Skeleton className="w-20 h-8 rounded-md" />
                        </div>
                    ))}
                </div>
            );
        
        case "table":
            return (
                <div className={`space-y-2 ${className}`}>
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="grid grid-cols-5 gap-4 items-center p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex flex-col gap-1">
                                    <Skeleton className="h-4 w-24 rounded-lg" />
                                    <Skeleton className="h-3 w-20 rounded-lg" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-16 rounded-lg" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-16 rounded-lg" />
                                <Skeleton className="h-5 w-20 rounded-lg" />
                            </div>
                            <Skeleton className="h-4 w-20 rounded-lg" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                    ))}
                </div>
            );
        
        default:
            return <RoomSkeleton />;
    }
} 