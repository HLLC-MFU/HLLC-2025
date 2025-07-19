import { useState, useMemo, useEffect, RefObject } from "react";
import {
    Accordion, AccordionItem, addToast, Button, Modal, ModalBody,
    ModalContent, ModalFooter, ModalHeader, Pagination
} from "@heroui/react";
import { Flower2, Settings } from "lucide-react";

import CardLamduanFlowers from "./CardLamduanFlowers";
import { FiltersLamduanFlowers } from "./FiltersLamduanFlowers";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { SettingLamduanFlowers } from "./SettingLamduanFlowers";

import { LamduanFlowers } from "@/types/lamduan-flowers";
import { useLamduanFlowers } from "@/hooks/useLamduanFlowers";
import { LamduanSetting } from "@/types/lamduan-flowers";
import { Lang } from "@/types/lang";

type LamduanFlowersSettingProps = {
    handleSave: (
        isChanged: boolean,
        file: File | null,
        videoLink: string,
        startDate: string,
        endDate: string,
        description: Lang
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
    const [rowsPerPage, setRowsPerPage] = useState<number | "All">(18);
    const resetToFirstPage = () => setCurrentPage(1);

    useEffect(() => {
        if (!lamduanFlowers || lamduanFlowers.length === 0) return;
        const flowersWithoutUser = lamduanFlowers.filter(item => !item.user);

        flowersWithoutUser.forEach(flower => {
            deleteLamduanFlowers(flower._id);
        });
    }, [lamduanFlowers]);

    const filteredAndSortedFlowers = useMemo(() => {
        if (!lamduanFlowers) return [];
        const flowersWithUser = lamduanFlowers.filter(item => item.user);
        const filtered = searchQuery.trim()
            ? flowersWithUser.filter(({ user, comment }) => {
                const q = searchQuery.toLowerCase();

                return user.username.toLowerCase().includes(q) || comment.toLowerCase().includes(q);
            })
            : flowersWithUser;

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

    const handleDelete = async () => {
        if (selectedFlower) {
            await deleteLamduanFlowers(selectedFlower._id);
            addToast({
                title: `Deleted ${selectedFlower.user?.username} flower.`,
                color: "success",
            });
        }
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

                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <p className="text-sm text-default-500"> Total: {filteredAndSortedFlowers.length} items </p>
                            <div className="flex items-center gap-2">
                                <label className="text-sm">Items per page:</label>
                                <select
                                    className="border rounded px-2 py-1 text-sm"
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        const value = e.target.value === "All" ? "All" : Number(e.target.value);

                                        setRowsPerPage(value);
                                        resetToFirstPage();
                                    }}
                                >
                                    {[18, 50, 100, "All"].map(size => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {totalPages > 1 && (
                            <div className="w-full sm:w-auto overflow-x-auto overflow-y-hidden scrollbar-hide">
                                <div className="inline-block min-w-max ml-auto sm:ml-0">
                                    <Pagination
                                        showControls
                                        page={currentPage}
                                        total={totalPages}
                                        onChange={setCurrentPage}
                                    />
                                </div>
                            </div>
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
                lamduanflower={selectedFlower || undefined}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDelete}
            />

            <Modal backdrop="blur" isOpen={!!viewModalFlower} placement="center" onClose={() => setViewModalFlower(null)}>
                <ModalContent className="max-w-md w-full">
                    <ModalHeader className="break-words">
                        {viewModalFlower?.user.username}
                    </ModalHeader>

                    <ModalBody className="flex flex-col items-center gap-4">
                        {viewModalFlower?.photo && (
                            <img
                                alt="User Photo"
                                className="rounded-xl object-contain max-h-80 w-full bg-white"
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${viewModalFlower.photo}`}
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
