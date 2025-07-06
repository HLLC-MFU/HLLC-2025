"use client";

import { Card, CardBody, Skeleton } from "@heroui/react";

export function RoomDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-8 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Room Info Card Skeleton */}
            <Card>
                <CardBody>
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-6 w-40 rounded-lg" />
                            <Skeleton className="h-4 w-32 rounded-lg" />
                        </div>
                        <Skeleton className="h-10 w-36 rounded-lg" />
                    </div>
                </CardBody>
            </Card>

            {/* Table Skeleton */}
            <Card>
                <CardBody>
                    <div className="space-y-4">
                        {/* Table Header */}
                        <div className="grid grid-cols-5 gap-4">
                            <Skeleton className="h-6 w-20 rounded-lg" />
                            <Skeleton className="h-6 w-16 rounded-lg" />
                            <Skeleton className="h-6 w-20 rounded-lg" />
                            <Skeleton className="h-6 w-20 rounded-lg" />
                            <Skeleton className="h-6 w-20 rounded-lg" />
                        </div>
                        
                        {/* Table Rows */}
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="grid grid-cols-5 gap-4 items-center">
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
                </CardBody>
            </Card>
        </div>
    );
} 