"use client"
import { PageHeader } from "@/components/ui/page-header";
import { addToast } from "@heroui/react";
import { Flower } from "lucide-react";
import AccordionLamduan from "./_components/AccordionLamduan";
import { useRef } from "react";
import { LamduanSetting } from "@/types/lamduan-flowers";
import { useLamduanSetting } from "@/hooks/useLamduanSetting";

export default function LamduanflowersPage() {
    const originalRef = useRef<LamduanSetting | null>(null);
    const { updateLamduanSetting, fetchLamduanSetting } = useLamduanSetting();

    const handleSave = async (
        isChanged: boolean,
        file: File | null,
        videoLink: string,
        startDate: string,
        endDate: string
    ) => {
        const original = originalRef.current;
        if (!original) {
            addToast({ title: "No data to update", color: "danger" });
            return;
        }

        if (!isChanged) {
            addToast({ title: "No changes made", color: "warning" });
            return;
        }

        const formData = new FormData();

        if (file instanceof File) {
            formData.append("tutorialPhoto", file);
        }
        if (videoLink !== original.tutorialVideo) {
            formData.append("tutorialVideo", videoLink);
        }
        if (startDate !== original.startAt?.split("T")[0]) {
            formData.append("startAt", startDate);
        }
        if (endDate !== original.endAt?.split("T")[0]) {
            formData.append("endAt", endDate);
        }

        await updateLamduanSetting(original._id, formData);
        await fetchLamduanSetting();
        window.location.reload();
    };
    return (
        <>
            <PageHeader description='This is Lamduan Flowers Page' icon={<Flower />} />
            <div className="flex flex-col min-h-screen">
                <div className="container mx-auto">
                    <div className="flex flex-col gap-6">
                        <AccordionLamduan
                            handleSave={handleSave}
                            originalRef={originalRef}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}