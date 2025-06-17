import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination
} from "@heroui/react";
import { Flower2, Settings } from "lucide-react";
import CardLamduanFlowers from "./CardLamduanFlowers";
import { useLamduanFlowers } from "@/hooks/useLamduanFlowers";
import { LamduanFlowersFilters } from "./FiltersLamduanFlowers";
import { LamduanFlowers } from "@/types/lamduan-flowers";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { LamduanFlowersSetting } from "./SettingLamduanFlowers";

export default function AccordionLamduan() {

  const { lamduanFlowers, deleteLamduanFlowers } = useLamduanFlowers();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedFlower, setSelectedFlower] = useState<LamduanFlowers | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModalFlower, setViewModalFlower] = useState<LamduanFlowers | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | "All">(24);

  // 🔧 FORCE RESET PAGE
  const resetToFirstPage = () => {
    setCurrentPage(prev => {
      if (prev === 1) {
        setCurrentPage(0);
        setTimeout(() => setCurrentPage(1), 0);
      } else {
        setCurrentPage(1);
      }
      return prev;
    });
  };

  const handleSortByChange = (sort: string) => {
    setSortBy(sort);
    resetToFirstPage();
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    resetToFirstPage();
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    resetToFirstPage();
  };

  const filteredAndSortedFlowers = useMemo(() => {
    if (!lamduanFlowers) return [];
    let filtered = lamduanFlowers;
    if (searchQuery.trim() !== "") {
      const lower = searchQuery.toLowerCase();
      filtered = lamduanFlowers.filter((item) => {
        const idMatch = item._id.toLowerCase().includes(lower);
        const usernameMatch = item.user.username.toLowerCase().includes(lower);
        const commentMatch = item.comment.toLowerCase().includes(lower);
        return idMatch || usernameMatch || commentMatch;
      });
    }
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [lamduanFlowers, searchQuery, sortBy, sortDirection]);

  const paginatedFlowers = useMemo(() => {
    if (rowsPerPage === "All") return filteredAndSortedFlowers;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedFlowers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedFlowers, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === "All" ? 1 : Math.ceil(filteredAndSortedFlowers.length / rowsPerPage);

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

  const handleViewClick = (flower: LamduanFlowers) => {
    setViewModalFlower(flower);
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
          <LamduanFlowersSetting />
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
            onSearchQueryChange={handleSearchChange}
            onSortByChange={handleSortByChange}
            onSortDirectionToggle={toggleSortDirection}
          />

          {filteredAndSortedFlowers.length === 0 && (
            <p className="text-center text-sm text-default-500 py-10">No lamduan flowers found.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
            {paginatedFlowers.map((item) => (
              <CardLamduanFlowers
                key={item._id}
                lamduanflowers={item}
                onDelete={() => handleDeleteClick(item)}
                onView={() => handleViewClick(item)}
              />
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 flex-wrap gap-2">
            <div className="flex items-center">
              <p className="text-sm text-default-500 mr-4">
                Total: {filteredAndSortedFlowers.length} items
              </p>
              <label className="mr-2 text-sm">Items per page:</label>
              <select
                className="border rounded px-2 py-1"
                value={rowsPerPage}
                onChange={(e) => {
                  const value = e.target.value === "All" ? "All" : Number(e.target.value);
                  setRowsPerPage(value);
                  setCurrentPage(1);
                }}
              >
                {[24, 50, 100, "All"].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {totalPages > 1 && (
              <Pagination showControls total={totalPages} page={currentPage} onChange={setCurrentPage} />
            )}
          </div>
        </AccordionItem>
      </Accordion>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        lamduanflower={selectedFlower || undefined}
      />

      <Modal backdrop="blur" isOpen={!!viewModalFlower} onClose={() => setViewModalFlower(null)} placement="center">
        <ModalContent className="max-w-md w-full">
          <ModalHeader className="break-words">{viewModalFlower?.user.username}</ModalHeader>
          <ModalBody>
            <p className="break-words whitespace-pre-wrap">
              {typeof viewModalFlower?.comment === "object"
                ? viewModalFlower?.comment || "No comment"
                : viewModalFlower?.comment}
            </p>
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
