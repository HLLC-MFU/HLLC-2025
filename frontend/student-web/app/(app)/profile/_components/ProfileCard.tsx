"use client";
import { Card, CardBody } from "@heroui/react";
import { useProfile } from "@/hooks/useProfile";
import { ProfileSkeleton } from "./ProfileSkeleton";

export default function ProfileCard() {
    const user = useProfile((state) => state.user);

    if (!user) {
        return <ProfileSkeleton />;
    }

    const fullName = [user.name.first, user.name.middle, user.name.last]
        .filter(Boolean)
        .join(" ");

    const majorName = user.major?.name ?? "-";
    const schoolName = user.major?.school?.name ?? "-";

    const profileItems = [
        { label: "NAME", value: fullName },
        { label: "USERNAME", value: user.username },
        { label: "SCHOOL", value: schoolName },
        { label: "MAJOR", value: majorName },
    ];

    return (
        <Card className="py-4">
            <CardBody className="pb-0 pt-2 px-4 flex-col items-start space-y-2">
                {profileItems.map((item, index) => (
                    <div key={index}>
                        <h4 className="font-bold text-large">{item.label}</h4>
                        <p className="text-default-500">{item.value}</p>
                    </div>
                ))}
            </CardBody>
        </Card>
    );
}
