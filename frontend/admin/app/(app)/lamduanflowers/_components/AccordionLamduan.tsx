import { useState, useMemo } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { Flower2, Settings } from "lucide-react";
import CardLamduanFlowers from "./CardLamduanFlowers";
import { useLamduanFlowers } from "@/hooks/useLamduanFlowers";
import { LamduanFlowersFilters } from "./FiltersLamduanFlowers";
import { LamduanFlowers } from "@/types/lamduan-flowers";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

export default function AccordionLamduan() {
    const { lamduanFlowers, deleteLamduanFlowers } = useLamduanFlowers();

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [selectedFlower, setSelectedFlower] = useState<LamduanFlowers | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredAndSortedFlowers = useMemo(() => {
        if (!lamduanFlowers) return [];

        let filtered = lamduanFlowers;

        if (searchQuery.trim() !== "") {
            const lower = searchQuery.toLowerCase();

            
        filtered = lamduanFlowers.filter((item) => {
            const idMatch = item._id.toLowerCase().includes(lower);
            const usernameMatch = item.user.username.toLowerCase().includes(lower);
            const commentMatch =
              typeof item.comment === "string"
                ? (typeof item.comment === "string" && (item.comment as string).toLowerCase().includes(lower))
                : (
                    (typeof item.comment?.th === "string" && item.comment?.th.toLowerCase().includes(lower)) ||
                    (typeof item.comment?.en === "string" && item.comment?.en.toLowerCase().includes(lower))
                  );
            return idMatch || usernameMatch || commentMatch;
        });
        }

        return filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case "createdAt":
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
            }

            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [lamduanFlowers, searchQuery, sortBy, sortDirection]);

    const toggleSortDirection = () => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    const handleDeleteClick = (flower: LamduanFlowers) => {
        setSelectedFlower(flower);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (selectedFlower) {
            deleteLamduanFlowers(selectedFlower._id);
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <Accordion variant="splitted">
                <AccordionItem
                    key="1"
                    aria-label="Accordion 1"
                    title={
                        <div className="flex items-center gap-2">
                            <Settings />
                            <span>Lamduan Flower Setting</span>
                        </div>
                    }
                >
                    {"กำลังสร้างมองข้ามไปก่อน🤙"}
                </AccordionItem>

                <AccordionItem
                    key="2"
                    aria-label="Accordion 2"
                    title={
                        <div className="flex items-center gap-2">
                            <Flower2 />
                            <span>Lamduan Flower Management</span>
                        </div>
                    }
                >
                    <LamduanFlowersFilters
                        searchQuery={searchQuery}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSearchQueryChange={setSearchQuery}
                        onSortByChange={setSortBy}
                        onSortDirectionToggle={toggleSortDirection}
                    />

                    {filteredAndSortedFlowers.length === 0 && (
                        <p className="text-center text-sm text-default-500 py-10">
                            No lamduan flowers found.
                        </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
                        {filteredAndSortedFlowers.map((item) => (
                            <CardLamduanFlowers
                                key={item._id}
                                lamduanflowers={item}
                                onDelete={() => handleDeleteClick(item)}
                            />
                        ))}
                    </div>
                </AccordionItem>
            </Accordion>

            <DeleteConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
                lamduanflower={selectedFlower || undefined}
            />
        </>
    );
}
