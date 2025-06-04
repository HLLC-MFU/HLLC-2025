import { Card, CardBody, CardHeader, Skeleton, Divider } from "@heroui/react";

export function SponsorDetailSkeleton() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col gap-6">
                    {/* Header Skeleton */}
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-20 h-10 rounded-lg" />
                        <Skeleton className="w-48 h-8 rounded-lg" />
                    </div>

                    {/* School Info Card Skeleton */}
                    <Card>
                        <CardHeader className="flex gap-3 p-4">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                            <div className="flex flex-col gap-2">
                                <Skeleton className="w-48 h-6 rounded-lg" />
                                <Skeleton className="w-32 h-4 rounded-lg" />
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-4 p-4">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-4 h-4 rounded-full" />
                                <Skeleton className="w-24 h-4 rounded-lg" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-4 h-4 rounded-full" />
                                <Skeleton className="w-32 h-4 rounded-lg" />
                            </div>
                            <Skeleton className="w-full h-16 rounded-lg" />
                        </CardBody>
                    </Card>

                    {/* Majors Section Skeleton */}
                    <div className="flex justify-between items-center">
                        <Skeleton className="w-24 h-8 rounded-lg" />
                        <Skeleton className="w-32 h-10 rounded-lg" />
                    </div>

                    {/* Majors Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index} isHoverable className="h-full">
                                <CardHeader className="flex gap-3 p-4">
                                    <Skeleton className="w-12 h-12 rounded-lg" />
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="w-32 h-6 rounded-lg" />
                                        <Skeleton className="w-24 h-4 rounded-lg" />
                                    </div>
                                </CardHeader>
                                <Divider />
                                <CardBody className="gap-4 p-4">
                                    <Skeleton className="w-full h-16 rounded-lg" />
                                </CardBody>
                                <Divider />
                                <CardBody className="flex justify-end p-4">
                                    <div className="flex gap-2">
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 