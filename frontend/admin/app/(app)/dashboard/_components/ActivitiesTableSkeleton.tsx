import { Card, CardBody, CardHeader, Skeleton, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";

export default function AssessmentTableSkeleton() {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-24 rounded-md" />
                        </CardHeader>
                        <CardBody>
                            <Skeleton className="h-8 w-16 rounded-md" />
                        </CardBody>
                    </Card>
                ))}
            </div>

            <Table aria-label="Posttest Averages Table">
                <TableHeader>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <TableColumn key={i}><Skeleton className="h-6 w-20 rounded-md" /></TableColumn>
                    ))}
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            {Array.from({ length: 4 }).map((_, j) => (
                                <TableCell key={j}><Skeleton className="h-6 w-24 rounded-md" /></TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}