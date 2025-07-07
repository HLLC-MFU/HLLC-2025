'use client'
import { useActivities } from "@/hooks/useActivities";
import { formatDateTime } from "@/utils/dateFormat";
import { Button, Card, Chip, ScrollShadow } from "@heroui/react";
import { ArrowLeft, MapPin } from "lucide-react";
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react";
import EmbedMap from "./_components/EmbedMap";
import Stepper, { Step } from "./_components/Stepper";
import { CircleCheck } from "lucide-react";

export default function ActivitiesDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { loading, activities } = useActivities();
    const activity = useMemo(
        () => activities.find((a) => a._id === id),
        [activities, id],
    );
    const [activeTab, setActiveTab] = useState<"about" | "status">("about");

    const HandleViewMap = () => {
        if (activity?.location?.mapUrl) {
            window.open(activity.location.mapUrl, "_blank");
        } else {
            alert("No map URL available.");
        }
    };
    const checkinStatusNumber = Number(activity?.checkinStatus);

    const completedSteps: number[] = [];
    if (activity) {
        completedSteps.push(1);
        if (activity.checkinStatus === 2) completedSteps.push(2);
        completedSteps.push(3);
        if (activity.hasAnsweredAssessment) completedSteps.push(4);
    }

    const steps: Step[] = activity
        ? [
            { title: "Start", value: formatDateTime(activity.metadata.startAt) },
            {
                title: "Check-in Status", value:
                    checkinStatusNumber === 1
                        ? "Check-in available now"
                        : checkinStatusNumber === 2
                            ? "You have already checked in"
                            : "Unknown status",
            },
            { title: "End", value: formatDateTime(activity.metadata.endAt) },
            { title: "Assessment", value: activity.hasAnsweredAssessment ? "Completed" : "Not Completed" },
        ]
        : [];

    return (
        <div className="min-h-screen flex flex-col gap-4">
            {/* ปุ่ม Back */}
            <div className="flex items-center gap-4 p-4 absolute z-10">
                <Button
                    startContent={<ArrowLeft size={16} />}
                    variant="flat"
                    radius="full"
                    onPress={() => router.back()}
                />
            </div>

            {/* รูปภาพ Banner เต็มหน้าจอ */}
            <div className="w-full h-[300px] md:h-[500px] overflow-hidden relative">
                <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity?.photo?.bannerPhoto}`}
                    alt="Banner"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* เนื้อหาใน Card */}

            <div className="flex-col flex items-star mt-5">
                <div className="flex justify-between w-full">
                    <div className="flex flex-col gap-2">
                        <p className="text-xs">ACTIVITY</p>
                        <p className="flex items-center font-bold text-xl">{activity?.name.en}</p>
                        <h1 className="flex items-center gap-2"><MapPin size={18} /><p>{activity?.location.en}</p></h1>
                    </div>
                    <Card radius="md" className="w-[60px] h-[80px] items-center justify-center flex text-center">
                        <p className="text-sm p-2">
                            {formatDateTime(activity?.metadata?.startAt)}
                        </p>
                    </Card>
                </div>
            </div>
            <div className="flex flex-col items-center">
                <div className="flex justify-between items-center w-full gap-2">
                    <Button
                        variant={activeTab === "about" ? "solid" : "flat"}
                        radius="md"
                        onPress={() => setActiveTab("about")}
                        className="text-center font-bold text-xs"
                    >
                        ABOUT
                    </Button>
                    <Button
                        variant={activeTab === "status" ? "solid" : "flat"}
                        radius="md"
                        onPress={() => setActiveTab("status")}
                        className="text-center font-bold text-xs"
                    >
                        ACTIVITY STATUS
                    </Button>
                    {/* change to checkin status */}
                    <Chip
                        color={
                            activity?.checkinStatus === 2 && activity?.hasAnsweredAssessment
                                ? "success"
                                : "danger"
                        }
                        className="text-xs font-bold flex items-center gap-1"
                    >
                        {activity?.checkinStatus === 2 && activity?.hasAnsweredAssessment ? (
                            <p className="flex items-center gap-1 text-white">
                                <CircleCheck size={16} color="white" /> Done
                            </p>
                        ) : (
                            "Not Done"
                        )}
                    </Chip>
                </div>
            </div>
            <div>
                {activeTab === "about" ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center">
                            {/* <p>{activity?.fullDetails.en}</p> */}
                            <ScrollShadow className="w-full h-[400px] flex flex-col break-all">iojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioaiojfdsdifsojdfsiojdfijodsfijosdfioa</ScrollShadow>
                        </div>
                        <div className="flex justify-between w-full items-center">
                            <h1 className="text-md text-center font-bold">
                                Locations
                            </h1>
                            <Button
                                variant="flat"
                                startContent={<MapPin size={15} />}
                                radius="md"
                                onPress={HandleViewMap}
                                className="text-center font-bold text-xs"
                            >
                                Open in Google Maps
                            </Button>
                        </div>
                        <EmbedMap
                            lat={activity?.location.latitude}
                            lng={activity?.location.longitude}
                        />
                    </div>

                ) : (
                    <div>
                        <Stepper
                            steps={steps}
                            direction="vertical"
                            completedSteps={completedSteps}
                        />
                    </div>
                )}
            </div>

        </div>
    )
}