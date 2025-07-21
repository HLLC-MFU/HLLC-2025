import { Button, Pagination } from "@heroui/react";
import { RoomMember } from "@/types/room";

type BottomContentProps = {
    filteredItems: RoomMember[];
    pages: number;
    page: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null;
    onPageChange?: (page: number) => void;
    showNavigationButtons?: boolean;
};

export default function BottomContent({
    filteredItems,
    pages,
    page,
    setPage,
    onPreviousPage,
    onNextPage,
    pagination,
    onPageChange,
    showNavigationButtons = true,
}: BottomContentProps) {
    return (
        <div className="py-2 px-2 flex justify-between items-center">
            
            {pagination && onPageChange ? (
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={pagination.page}
                    total={pagination.totalPages}
                    onChange={onPageChange}
                />
            ) : (
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                />
            )}
            
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