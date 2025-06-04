import React from 'react';
import { Button, Pagination } from '@heroui/react';

interface BottomContentProps {
  selectedCount: number;
  totalCount: number;
  page: number;
  pages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageChange: (page: number) => void;
}

export default function BottomContent({
  selectedCount,
  totalCount,
  page,
  pages,
  onPreviousPage,
  onNextPage,
  onPageChange,
}: BottomContentProps) {
  return (
    <div className="py-2 px-2 flex justify-between items-center">
      <span className="w-[30%] text-small text-default-400">
        {selectedCount === totalCount && totalCount > 0
          ? 'All items selected'
          : `${selectedCount} of ${totalCount} selected`}
      </span>
      <Pagination
        isCompact
        showControls
        showShadow
        color="primary"
        page={page}
        total={pages}
        onChange={onPageChange}
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
