import { useState, useMemo, RefObject } from "react";
import {
    Accordion, AccordionItem, Button, Modal, ModalBody,
    ModalContent, ModalFooter, ModalHeader, Pagination
} from "@heroui/react";
import { Flower2, Settings } from "lucide-react";
import CardLamduanFlowers from "./CardLamduanFlowers";
import { useLamduanFlowers } from "@/hooks/useLamduanFlowers";
import { FiltersLamduanFlowers } from "./FiltersLamduanFlowers";
import { LamduanFlowers } from "@/types/lamduan-flowers";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { SettingLamduanFlowers } from "./SettingLamduanFlowers";
import { LamduanSetting } from "@/types/lamduan-flowers";

type LamduanFlowersSettingProps = {
    handleSave: (
        isChanged: boolean,
        file: File | null,
        videoLink: string,
        startDate: string,
        endDate: string
    ) => Promise<void>;
    originalRef: RefObject<LamduanSetting | null>;
}

export default function AccordionLamduan({
    handleSave,
    originalRef,
}: LamduanFlowersSettingProps) {
    const { lamduanFlowers, deleteLamduanFlowers } = useLamduanFlowers();

    const [searchQuery, setSearchQuery] = useState("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [selectedFlower, setSelectedFlower] = useState<LamduanFlowers | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewModalFlower, setViewModalFlower] = useState<LamduanFlowers | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<number | "All">(24);

    const resetToFirstPage = () => setCurrentPage(1);

    const filteredAndSortedFlowers = useMemo(() => {
        if (!lamduanFlowers) return [];

        const filtered = searchQuery.trim()
            ? lamduanFlowers.filter(({ user, comment }) => {
                const q = searchQuery.toLowerCase();
                return user.username.toLowerCase().includes(q) || comment.toLowerCase().includes(q);
            })
            : lamduanFlowers;

        return [...filtered].sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
        });
    }, [lamduanFlowers, searchQuery, sortDirection]);

    const paginatedFlowers = useMemo(() => {
        if (rowsPerPage === "All") return filteredAndSortedFlowers;
        const start = (currentPage - 1) * rowsPerPage;
        return filteredAndSortedFlowers.slice(start, start + rowsPerPage);
    }, [filteredAndSortedFlowers, currentPage, rowsPerPage]);

    const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filteredAndSortedFlowers.length / rowsPerPage);

    const handleDelete = () => {
        if (selectedFlower) deleteLamduanFlowers(selectedFlower._id);
        setIsModalOpen(false);
    };

    return (
        <>
            <Accordion variant="splitted">
                <AccordionItem
                    key="2"
                    aria-label="Management"
                    title={<div className="flex items-center gap-2"><Flower2 /><span>Lamduan Flower Management</span></div>}
                >
                    <FiltersLamduanFlowers
                        searchQuery={searchQuery}
                        sortBy="createdAt"
                        sortDirection={sortDirection}
                        onSearchQueryChange={(v) => { setSearchQuery(v); resetToFirstPage(); }}
                        onSortByChange={() => { }}
                        onSortDirectionToggle={() => { setSortDirection(prev => prev === "asc" ? "desc" : "asc"); resetToFirstPage(); }}
                    />

                    {filteredAndSortedFlowers.length === 0 ? (
                        <p className="text-center text-sm text-default-500 py-10">No lamduan flowers found.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
                            {paginatedFlowers.map(item => (
                                <CardLamduanFlowers
                                    key={item._id}
                                    lamduanflowers={item}
                                    onDelete={() => { setSelectedFlower(item); setIsModalOpen(true); }}
                                    onView={() => setViewModalFlower(item)}
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-6 flex-wrap gap-2">
                        <div className="flex items-center">
                            <p className="text-sm text-default-500 mr-4">Total: {filteredAndSortedFlowers.length} items</p>
                            <label className="mr-2 text-sm">Items per page:</label>
                            <select
                                className="border rounded px-2 py-1"
                                value={rowsPerPage}
                                onChange={(e) => {
                                    const value = e.target.value === "All" ? "All" : Number(e.target.value);
                                    setRowsPerPage(value);
                                    resetToFirstPage();
                                }}
                            >
                                {[24, 50, 100, "All"].map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>

                        {totalPages > 1 && (
                            <Pagination showControls total={totalPages} page={currentPage} onChange={setCurrentPage} />
                        )}
                    </div>
                </AccordionItem>
                <AccordionItem
                    key="1"
                    aria-label="Setting"
                    title={<div className="flex items-center gap-2"><Settings /><span>Lamduan Flower Setting</span></div>}
                >
                    <SettingLamduanFlowers
                        handleSave={handleSave}
                        originalRef={originalRef}
                    />
                </AccordionItem>
            </Accordion>

            <DeleteConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDelete}
                lamduanflower={selectedFlower || undefined}
            />

            <Modal backdrop="blur" isOpen={!!viewModalFlower} onClose={() => setViewModalFlower(null)} placement="center">
                <ModalContent className="max-w-md w-full">
                    <ModalHeader className="break-words">
                        {viewModalFlower?.user.username}
                    </ModalHeader>

                    <ModalBody className="flex flex-col items-center gap-4">
                        {viewModalFlower?.photo && (
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${viewModalFlower.photo}`}
                                alt="User Photo"
                                className="rounded-xl object-contain max-h-80 w-full bg-white"
                            />
                        )}
                        <div className="w-full max-w-full overflow-auto">
                            <p className="break-words whitespace-pre-wrap text-center text-sm px-2">
                                {viewModalFlower?.comment?.trim() || "No comment"}
                            </p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={() => setViewModalFlower(null)}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </>
    );
}
