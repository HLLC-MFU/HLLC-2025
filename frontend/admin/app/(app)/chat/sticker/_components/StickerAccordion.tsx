import { Sticker } from "@/types/sticker";
import StickerTable from "./StickerTable";

type StickerAccordionProps = {
    stickers: Sticker[];
    onAdd: () => void;
    onEdit: (sticker: Sticker) => void;
    onDelete: (sticker: Sticker) => void;
};

export default function StickerAccordion({
    stickers,
    onAdd,
    onEdit,
    onDelete,
}: StickerAccordionProps) {
    return (
        <StickerTable
            stickers={stickers}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
} 