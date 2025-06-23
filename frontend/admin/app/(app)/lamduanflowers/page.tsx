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
    const { createLamduanSetting, updateLamduanSetting, fetchLamduanSetting } = useLamduanSetting();

    const handleSave = async (
        isChanged: boolean,
        file: File | null,
        videoLink: string,
        startDate: string,
        endDate: string
    ) => {
        const original = originalRef.current;

        const formData = new FormData();

        if (file instanceof File) {
            formData.append("tutorialPhoto", file);
        }
        formData.append("tutorialVideo", videoLink);
        formData.append("startAt", startDate);
        formData.append("endAt", endDate);

        if (!original) {
            await createLamduanSetting(formData);
        } else if (isChanged) {
            await updateLamduanSetting(original._id, formData);
        } else {
            addToast({ title: "No changes made", color: "warning" });
            return;
        }
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