import type { Selection } from "@react-types/shared";
import { Button, Pagination } from "@heroui/react";
import { Sticker } from "@/types/sticker";

type StickerBottomContentProps = {
    selectedKeys: Selection;
    filteredItems: Sticker[];
    page: number;
    pages: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    showSelectionInfo?: boolean;
    showNavigationButtons?: boolean;
};

export default function StickerBottomContent({
    selectedKeys,
    filteredItems,
    page,
    pages,
    setPage,
    onPreviousPage,
    onNextPage,
    showSelectionInfo = true,
    showNavigationButtons = true,
}: StickerBottomContentProps) {
    const getSelectionText = () => {
        if (typeof selectedKeys === "string" && selectedKeys === "all") {
            return "All items selected";
        }
        
        const selectedCount = selectedKeys && typeof selectedKeys !== "string" && "size" in selectedKeys 
            ? (selectedKeys as { size: number }).size 
            : 0;
            
        return `${selectedCount} of ${filteredItems ? filteredItems.length : 0} selected`;
    };

    return (
        <div className="py-2 px-2 flex justify-between items-center">
            {showSelectionInfo && (
                <span className="w-[30%] text-small text-default-400">
                    {getSelectionText()}
                </span>
            )}
            
            <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={pages ?? 1}
                onChange={setPage}
            />
            
            {showNavigationButtons && (
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
            )}
        </div>
    );
} 