"use client";

import { Sponsor } from "@/types/sponsor";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { ArrowLeft, Building2, GraduationCap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function SponsorDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [sponsor] = useState<Sponsor | null>(null);

    return (
        <div className="flex flex-cols min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex flex-col gap-6">
                    <div className="flex itmes-center gap-4">
                        <Button variant="flat" startContent={<ArrowLeft />} onPress={() => router.back()}>
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">{sponsor?.name.en ?? "Unnamed Sponsor"}</h1>
                    </div>

                    <Card>
                        <CardHeader className="flex gap-3 p-4">
                            <Card radius="md" className="w-12 h-12 flex items-center justify-center">
                                {sponsor?.name.en ?? "N/A"}
                            </Card>
                            <div className="flex flex-col">
                                <p className="text-lg font-semibold">{sponsor?.name.en ?? "N/A"}</p>
                                <p className="text-small text-default-500">{sponsor?.name.th ?? "N/A"}</p>
                            </div>
                        </CardHeader>
                        <Divider />
                        <CardBody className="gap-4 p-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="text-default-500" size={16} />
                                <span className="text-sm text-default-500">{sponsor?.name.en ?? "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <GraduationCap className="text-default-500" size={16} />
                                <span className="text-sm text-default-500">{sponsor?.name.en ?? "N/A"} Programs</span>
                            </div>
                            <p className="text-sm text-default-500">{sponsor?.description.en ?? "No details available."}</p>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}