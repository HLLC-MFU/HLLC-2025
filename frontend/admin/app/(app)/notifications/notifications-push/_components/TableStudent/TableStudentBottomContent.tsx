import { Pagination } from "@heroui/react";

interface BottomContentProps {
    page: number;
    pages: number;
    setPage: (page: number) => void;
    selectedKeys: Set<string> | "all";
    items: any[];
    hasSearchFilter: boolean;
}

export default function BottomContent({ page, pages, setPage, selectedKeys, items, hasSearchFilter }: BottomContentProps) {
    return (
        <div className="py-2 px-2 flex justify-between items-center">
            <Pagination
                showControls
                classNames={{
                    cursor: "bg-foreground text-background",
                }}
                color="default"
                isDisabled={hasSearchFilter}
                page={page}
                total={pages}
                variant="light"
                onChange={setPage}
            />
            <span className="text-small text-default-400">
                {selectedKeys === "all"
                    ? "All items selected"
                    : `${selectedKeys.size} of ${items.length} selected`}
            </span>
        </div>
    )
}
