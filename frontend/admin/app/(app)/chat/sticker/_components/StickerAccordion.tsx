import StickerTable from "./StickerTable";

import { Sticker } from "@/types/sticker";

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
            onDelete={onDelete}
            onEdit={onEdit}
        />
    );
} 