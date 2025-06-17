import { Evoucher } from "@/types/evoucher/d";
import { Button, Pagination } from "@heroui/react";
import type { Selection } from "@react-types/shared";

export type BottomContentProps = {
    selectedKeys: Selection;
    filteredItems: Evoucher[];
    page: number;
    pages: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
};

export default function BottomContent({
    selectedKeys,
    filteredItems,
    page,
    pages,
    setPage,
    onPreviousPage,
    onNextPage,
}: BottomContentProps) {
    return (
        <div className="py-2 px-2 flex justify-between items-center">
            <span className="w-[30%] text-small text-default-400">
                {typeof selectedKeys === "string" && selectedKeys === "all"
                    ? "All items selected"
                    : `${selectedKeys && typeof selectedKeys !== "string" && "size" in selectedKeys ? (selectedKeys as { size: number }).size : 0} of ${filteredItems ? filteredItems.length : 0} selected`}
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
                <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
                    Previous
                </Button>
                <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
                    Next
                </Button>
            </div>
        </div>
    )
};