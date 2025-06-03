import { Accordion, AccordionItem, addToast, Card, CardBody, CardHeader } from "@heroui/react";
import { SystemCard } from "../systems/_components/SystemCard";
import { useSystem } from "@/hooks/useSystem";
import { useState } from "react";
import { System } from "@/types/system";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";


export default function SettingAccoardion() {
    const { systems, updateSystem } = useSystem();
    const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
                    {systems.map((system) => (
                        <SystemCard
                            key={system._id}
                            system={system}
                            onClick={handleUpdateSystem}
                        />
                    ))}
                    <ConfirmationModal
                        body={
                            selectedSystem?.status
                                ? "Are you sure you want to close the system?"
                                : "Are you sure you want to open the system?"
                        }
                        confirmColor={selectedSystem?.status ? "danger" : "success"}
                        confirmText={selectedSystem?.status ? "Close" : "Open"}
                        isOpen={isModalOpen}
                        title={selectedSystem?.status ? "Close system" : "Open system"}
                        onClose={() => {
                            setSelectedSystem(null);
                            setIsModalOpen(false);
                        }}
                        onConfirm={handleConfirm}
                    />
                </div>
            </AccordionItem>
        </Accordion>
    )
}