import { Leaderboard } from "@/types/coin-hunting";
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Key, useCallback, useMemo, useState } from "react";
import LeaderBoardCellRenderer from "./LeaderBoardCellRenderer";

import TopContent from "./TopContent";
import BottomContent from "./BottomContent";

const COLUMNS = [
    { name: "RANK", uid: "rank", allowsSorting: true },
    { name: "USERNAME", uid: "username", },
    { name: "NAME", uid: "name", },
    { name: "COINCOUNT", uid: "coinCount", allowsSorting: true },
    { name: "LASTESTCOLLECTEDAT", uid: "latestCollectedAt", allowsSorting: true },
]

type LeaderBoardTableProps = {
    leaderboards: Leaderboard[];
};

export default function LeaderBoardTable({ leaderboards }: LeaderBoardTableProps) {
    const [filterValue, setFilterValue] = useState("");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "rank",
        direction: "ascending"
    });
    const [page, setPage] = useState(1);
    const rowsPerPage = 5;

    const handleSearch = (value: string) => {
        setFilterValue(value);
        setPage(1);
    };

    const handleClear = () => {
        setFilterValue("");
        setPage(1);
    };

    const filteredItems = useMemo(() => {
        let filteredLeaderboard = [...(leaderboards ?? [])]
        const query = filterValue.toLowerCase();

        if (!!filterValue) {
            filteredLeaderboard = leaderboards.filter(
                (leaderboard) =>
                    leaderboard.name.first?.toLowerCase().includes(query) ||
                    leaderboard.name.middle?.toLowerCase().includes(query) ||
                    leaderboard.name.last?.toLowerCase().includes(query) ||
                    leaderboard.username?.toLowerCase().includes(query) ||
                    leaderboard.rank.toString().toLowerCase().includes(query)
            );
        }
        return filteredLeaderboard;
    }, [leaderboards, filterValue]);

    const leaderboardItems = useMemo(() => {
        const sortedItems = [...filteredItems];

        if (sortDescriptor.column && sortDescriptor.direction) {
            sortedItems.sort((a, b) => {
                const direction = sortDescriptor.direction === "ascending" ? 1 : -1;

                if (sortDescriptor.column === "coinCount") {
                    return (a.coinCount - b.coinCount) * direction;
                }

                if (sortDescriptor.column === "latestCollectedAt") {
                    const aTime = new Date(a.latestCollectedAt ?? "").getTime();
                    const bTime = new Date(b.latestCollectedAt ?? "").getTime();
                    return (aTime - bTime) * direction;
                }

                if (sortDescriptor.column === "rank") {
                    return (a.rank - b.rank) * direction;
                }

                return 0;
            });
        }

        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedItems.slice(start, end);
    }, [page, filteredItems, sortDescriptor]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;


    const renderCell = useCallback(
        (leaderboard: Leaderboard, columnKey: Key) => {
            return (
                <LeaderBoardCellRenderer
                    leaderboard={leaderboard}
                    columnKey={columnKey}
                />
            );
        },
        [leaderboards]
    );
    return (
        <Table
            isHeaderSticky
            aria-label="Leaderboard Table"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            topContentPlacement="outside"
            topContent={
                <TopContent
                    filterValue={filterValue}
                    onClear={handleClear}
                    onSearchChange={handleSearch}
                />
            }
            bottomContentPlacement="outside"
            bottomContent={
                <BottomContent
                    page={page}
                    pages={pages}
                    setPage={setPage}
                />
            }
        >
            <TableHeader columns={COLUMNS}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                        allowsSorting={column.allowsSorting}
                    >
                        {column.name}
                    </TableColumn>

                )}
            </TableHeader>
            <TableBody
                emptyContent={
                    <div className="flex flex-col items-center justify-center py-8">
                        <span className="text-default-400">No user found</span>
                    </div>
                }
                items={[...leaderboardItems]}
            >
                {(leaderboard: Leaderboard) => (
                    <TableRow
                        key={leaderboard.userId}
                        className="hover:bg-default-50 transition-colors"
                    >
                        {(columnKey) => (
                            <TableCell className={`${columnKey.toString()} py-4`}>
                                {renderCell(leaderboard, columnKey)}
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>

        </Table>
    );
}
