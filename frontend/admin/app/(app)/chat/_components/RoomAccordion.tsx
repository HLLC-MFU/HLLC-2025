import { Room, RoomType } from "@/types/chat";
import { Accordion, AccordionItem } from "@heroui/react";
import { RoomCard } from "./RoomCard";

type RoomAccordionProps = {
    room: Room[];
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
}

export default function RoomAccordion({ 
    room , 
    onEdit, 
    onDelete }: RoomAccordionProps) {

    // Group room by type & groupType
    const normalRoom = room.filter(r => r.type === RoomType.NORMAL);
    const readonlyRoom = room.filter(r => r.type === RoomType.READONLY);
    const groupRoom = room.filter(r => r.metadata?.groupType === "school");
    const majorRoom = room.filter(r => r.metadata?.groupType === "major");

    return (
        <Accordion variant="splitted" selectionMode="multiple">
            
            {/* Normal Rooms Accordion */}
            <AccordionItem key="normal" aria-label="Normal Rooms" title="Normal Rooms">
                {normalRoom.length === 0 ? (
                    <p className="text-sm text-gray-500">No normal rooms found</p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {normalRoom.map((room) => (
                            <RoomCard
                                key={room._id}
                                room={room}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </AccordionItem>

            {/* Readonly Rooms Accordion */}
            <AccordionItem key="readonly" aria-label="Readonly Rooms" title="Readonly Rooms">
                {readonlyRoom.length === 0 ? (
                    <p className="text-sm text-gray-500">No readonly rooms found</p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {readonlyRoom.map((room) => (
                            <RoomCard
                                key={room._id}
                                room={room}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </AccordionItem>

            {/* School Rooms Accordion */}
            <AccordionItem key="school" aria-label="School Rooms" title="School Rooms">
                {groupRoom.length === 0 ? (
                    <p>No group rooms available.</p>
                ) : (
                    groupRoom.map((room) => (
                        <RoomCard
                            key={room._id}
                            room={room}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </AccordionItem>

            {/* Major Rooms Accordion */}
            <AccordionItem key="major" aria-label="Major Rooms" title="Major Rooms">
                {majorRoom.length === 0 ? (
                    <p>No major rooms available.</p>
                ) : (
                    majorRoom.map((room) => (
                        <RoomCard
                            key={room._id}
                            room={room}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </AccordionItem>
        </Accordion>
    )
}