import { Accordion, AccordionItem, addToast, Card, CardBody, CardHeader, Button } from "@heroui/react";
import { SystemCard } from "../systems/_components/SystemCard";
import { useSystem } from "@/hooks/useSystem";
import { useState } from "react";
import { System } from "@/types/system";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { useRouter } from "next/navigation";

export default function SettingAccoardion() {
    const { systems, updateSystem } = useSystem();
    const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();
    const handleUpdateSystem = (system: System) => {
        setSelectedSystem(system);
        setIsModalOpen(true);
    };

    const handleConfirm = async () => {
        if (!selectedSystem) return;

        const updatedStatus = !selectedSystem.status;

        await updateSystem(selectedSystem._id, {
            ...selectedSystem,
            status: updatedStatus,
        });

        addToast({
            title: "System status updated successfully",
            color: "success",
        });

        setSelectedSystem(null);
        setIsModalOpen(false);
    };

    const defaultContent = ['1', '2', '3']
    return (
        <Accordion variant="shadow">
            <AccordionItem key="1" aria-label="Accordion 1" title="Accordion 1">
                {defaultContent.indexOf(defaultContent[1])}
            </AccordionItem>
            <AccordionItem key="2" aria-label="Accordion 2" title="Accordion 2">
                {defaultContent.indexOf(defaultContent[2])}
            </AccordionItem>
            <AccordionItem key="3" aria-label="Accordion 3" title="System status">
                <div className="w-full h-full p-2">
                    <div className="flex justify-end mb-4">
                        <Button 
                            color="primary"
                            onClick={() => router.push('settings/systems')}
                        >
                            View All Systems
                        </Button>
                    </div>
                </div>
            </AccordionItem>
        </Accordion>
    )
}