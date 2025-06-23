import { Button, Pagination } from "@heroui/react";
import type { Selection } from "@react-types/shared";
import { EvoucherCode } from "@/types/evoucher-code";

interface BottomContentProps {
    filteredItems: EvoucherCode[];
    page: number;
    pages: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
}

export default function BottomContent({
    filteredItems,
    page,
    pages,
    setPage,
    onPreviousPage,
    onNextPage,
}: BottomContentProps) {
    return (
        <div className="py-2 px-2 flex justify-between items-center">
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
                <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
                    Previous
                </Button>
                <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
                    Next
                </Button>
            </div>
        </div>
    );
}
