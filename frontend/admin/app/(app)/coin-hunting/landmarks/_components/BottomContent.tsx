import { Pagination } from "@heroui/react";

export type BottomContentProps = {
    page: number;
    pages: number;
    setPage: (page: number) => void;
};

export default function BottomContent({
    page,
    pages,
    setPage,
}: BottomContentProps) {
    return (
        <div className="py-2 px-2 flex justify-center items-center">
            <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={pages ?? 1}
                onChange={setPage}
            />
        </div>
    )
}