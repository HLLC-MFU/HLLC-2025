
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Key, useCallback, useMemo, useState } from "react";
import BottomContent from "./BottomContent";
import { Landmark, Sponsorboard } from "@/types/coin-hunting";
import SponsorBoardCellRenderer from "./SponsorBoardCellRenderer";
import TopContentSponsor from "./TopContentSponsor";

const COLUMNS = [
    { name: "RANK", uid: "rank", allowsSorting: true },
    { name: "USERNAME", uid: "username", },
    { name: "NAME", uid: "name", },
    { name: "COINCOUNT", uid: "coinCount", allowsSorting: true },
    { name: "LASTESTCOLLECTEDAT", uid: "latestCollectedAt", allowsSorting: true },
]

type SponsorBoardTableProps = {
    sponsorboards: Sponsorboard[];
    landmark: Landmark[];
    selectedLandmarkId: string | null;
    onLandmarkChange: (id: string) => void;
};

export default function SponsorBoardTable({ sponsorboards, landmark, selectedLandmarkId, onLandmarkChange }: SponsorBoardTableProps) {
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
        let filteredSponsorboard = [...(sponsorboards ?? [])]
        const query = filterValue.toLowerCase();

        if (!!filterValue) {
            filteredSponsorboard = sponsorboards.filter(
                (sponsorboard) =>
                    sponsorboard.name.first?.toLowerCase().includes(query) ||
                    sponsorboard.name.middle?.toLowerCase().includes(query) ||
                    sponsorboard.name.last?.toLowerCase().includes(query) ||
                    sponsorboard.username?.toLowerCase().includes(query) ||
                    sponsorboard.rank.toString().toLowerCase().includes(query)
            );
        }
        return filteredSponsorboard;
    }, [sponsorboards, filterValue]);

    const sponsorboardItems = useMemo(() => {
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
        (sponsorboard: Sponsorboard, columnKey: Key) => {
            return (
                <SponsorBoardCellRenderer
                    sponsorboard={sponsorboard}
                    columnKey={columnKey}
                />
            );
        },
        [sponsorboards]
    );
    return (
        <Table
            isHeaderSticky
            aria-label="Leaderboard Table"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            topContentPlacement="outside"
            topContent={
                <TopContentSponsor
                    filterValue={filterValue}
                    onClear={handleClear}
                    onSearchChange={handleSearch}
                    selectedLandmarkId={selectedLandmarkId}
                    landmark={landmark}
                    onLandmarkChange={onLandmarkChange}
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
                items={[...sponsorboardItems]}
            >
                {(sponsorboard: Sponsorboard) => (
                    <TableRow
                        key={sponsorboard.userId}
                        className="hover:bg-default-50 transition-colors"
                    >
                        {(columnKey) => (
                            <TableCell className={`${columnKey.toString()} py-4`}>
                                {renderCell(sponsorboard, columnKey)}
                            </TableCell>
                        )}
                    </TableRow>
                )}
            </TableBody>

        </Table>
    );
}
