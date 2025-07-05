'use client'
import { useActivities } from "@/hooks/useActivities";
import { formatDateTime } from "@/utils/dateFormat";
import { Button, Card, ScrollShadow } from "@heroui/react";
import { ArrowLeft, MapPin } from "lucide-react";
import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react";
import EmbedMap from "./_components/mapEmbed";

const lat = 20.0455790;
const lng = 99.8938734;

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
                    <p>{activity?.name.en}</p>
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
                    <ScrollShadow className="w-full h-[400px] flex flex-col break-words whitespace-pre-line">
                        {activity?.metadata?.isOpen ? "Activity is OPEN" : "Activity is CLOSED"}
                    </ScrollShadow>
                )}
            </div>

        </div>
    )
}