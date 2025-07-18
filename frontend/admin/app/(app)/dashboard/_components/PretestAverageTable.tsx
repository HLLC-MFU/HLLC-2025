'use client';

import { useState } from 'react';
import { PretestAverage } from '@/types/pretestAnswer';
import {
    TableHeader,
    TableRow,
    TableBody,
    TableCell,
    Table,
    TableColumn,
    Pagination,
} from '@heroui/react';

type PretestAverageTableProps = {
    pretestAnswer: PretestAverage[];
};

function formatAverage(value: number) {
    return value.toFixed(2);
}

export default function PretestAverageTable({ pretestAnswer }: PretestAverageTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const pretestData = pretestAnswer.map((item, index) => ({
        id: index + 1,
        question: item.pretest.question.en || item.pretest.question.th || 'Unnamed',
        count: item.count,
        average: item.average,
    }));

    const totalPages = Math.ceil(pretestData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = pretestData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="flex-col flex gap-5 w-full">

            <div className='flex flex-col gap-4'>
                <Table aria-label="Pretest Averages Table">
                    <TableHeader>
                        <TableColumn>No</TableColumn>
                        <TableColumn>Question</TableColumn>
                        <TableColumn>Count</TableColumn>
                        <TableColumn>Average</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No rows to display" items={currentItems}>
                        {(pretest) => (
                            <TableRow key={pretest.id}>
                                <TableCell>{pretest.id}</TableCell>
                                <TableCell>{pretest.question}</TableCell>
                                <TableCell>{pretest.count}</TableCell>
                                <TableCell>
                                    {formatAverage(pretest.average)}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className='flex justify-end'>
                    <Pagination showControls initialPage={currentPage} total={totalPages} />
                </div>
            </div>
        </div>
    );
}
