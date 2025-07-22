'use client';

import { useState } from 'react';
import { TableHeader, TableRow, TableBody, TableCell, Table, TableColumn, Pagination, } from '@heroui/react';
import { usePretest } from '@/hooks/usePretestAnswer';

function formatAverage(value: number) {
    return value.toFixed(2);
}

export default function PretestAverageTable() {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const { pretestAverage, totalAverageCount, error } = usePretest({
        page: currentPage,
        limit: itemsPerPage,
    });

    if (error) return <div className="text-red-500">{error}</div>;

    const pretestData = pretestAverage.map((item, index) => ({
        id: (currentPage - 1) * itemsPerPage + index + 1,
        question: item.pretest.question.en || item.pretest.question.th || 'Unnamed',
        count: item.count,
        average: item.average,
    }));

    const totalPages = Math.ceil(totalAverageCount / itemsPerPage);

    return (
        <div className="flex-col flex gap-5 w-full">
            <div className="flex flex-col gap-4">
                <Table aria-label="Pretest Averages Table">
                    <TableHeader>
                        <TableColumn>No</TableColumn>
                        <TableColumn>Question</TableColumn>
                        <TableColumn>Count</TableColumn>
                        <TableColumn>Average</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No rows to display" items={pretestData}>
                        {(pretest) => (
                            <TableRow key={pretest.id}>
                                <TableCell>{pretest.id}</TableCell>
                                <TableCell>{pretest.question}</TableCell>
                                <TableCell>{pretest.count}</TableCell>
                                <TableCell>{formatAverage(pretest.average)}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex justify-end">
                    <Pagination
                        showControls
                        page={currentPage}
                        total={totalPages}
                        onChange={setCurrentPage}
                    />
                </div>
            </div>
        </div>
    );
}
