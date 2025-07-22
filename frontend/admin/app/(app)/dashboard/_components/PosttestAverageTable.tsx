import { useState } from 'react';
import { TableHeader, TableRow, TableBody, TableCell, Table, TableColumn, Pagination, } from '@heroui/react';
// import { usePosttest } from '@/hooks/usePosttestAnswer';
import { PotestAverage } from '@/types/posttestAnswer';

function formatAverage(value: number) {
    return value.toFixed(2);
}

type PosttestAverageTableProps = {
    posttestAverage: PotestAverage[];
    totalAverageCount: number;
};

export default function PosttestAverageTable({ posttestAverage, totalAverageCount }: PosttestAverageTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;


    // Pagination logic (slice data for current page)
    const paginatedData = posttestAverage?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || [];
    const posttestData = paginatedData.map((item, index) => ({
        id: (currentPage - 1) * itemsPerPage + index + 1,
        question: item.posttest?.question?.en || item.posttest?.question?.th || 'Unnamed',
        count: item.count,
        average: item.average,
    }));

    const totalPages = Math.ceil(totalAverageCount / itemsPerPage) || 1;

    return (
        <div className="flex-col flex gap-5 w-full">
            <div className="flex flex-col gap-4">
                <Table aria-label="Posttest Averages Table">
                    <TableHeader>
                        <TableColumn>No</TableColumn>
                        <TableColumn>Question</TableColumn>
                        <TableColumn>Count</TableColumn>
                        <TableColumn>Average</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No rows to display" items={posttestData}>
                        {(posttest) => (
                            <TableRow key={posttest.id}>
                                <TableCell>{posttest.id}</TableCell>
                                <TableCell>{posttest.question}</TableCell>
                                <TableCell>{posttest.count}</TableCell>
                                <TableCell>{formatAverage(posttest.average)}</TableCell>
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