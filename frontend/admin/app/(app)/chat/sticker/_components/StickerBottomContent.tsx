import { Button, Pagination } from "@heroui/react";
import { Sticker } from "@/types/sticker";

type StickerBottomContentProps = {
    filteredItems: Sticker[];
    page: number;
    pages: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
};

export default function StickerBottomContent({
    filteredItems,
    page,
    pages,
    setPage,
    onPreviousPage,
    onNextPage,
}: StickerBottomContentProps) {
    return (
        <div className="py-2 px-2 flex justify-between items-center">
            <span className="w-[30%] text-small text-gray-400">
                {filteredItems.length} stickers total
            </span>
            
            <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={pages ?? 1}
                onChange={setPage}
            />
            
            <div className="hidden sm:flex w-[30%] justify-end gap-2">
                <Button 
                    isDisabled={pages === 1} 
                    size="sm" 
                    variant="flat" 
                    onPress={onPreviousPage}
                >
                    Previous
                </Button>
                <Button 
                    isDisabled={pages === 1} 
                    size="sm" 
                    variant="flat" 
                    onPress={onNextPage}
                >
                    Next
                </Button>
            </div>
        </div>
    );
} 