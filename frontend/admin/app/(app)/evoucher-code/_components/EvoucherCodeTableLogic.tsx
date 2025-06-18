import { useState, useMemo } from "react";
import { SortDescriptor, addToast } from "@heroui/react";
import type { Selection } from "@react-types/shared";
import { EvoucherCode } from "@/types/evoucher-code";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";

// Utility functions
const filterItems = (items: EvoucherCode[], search: string) => {
    const query = search.toLowerCase();
    return items.filter(code =>
        code.code.toLowerCase().includes(query) ||
        code.evoucher?.acronym?.toLowerCase().includes(query) ||
        code.evoucher?.sponsors?.name.en?.toLowerCase().includes(query) ||
        code.evoucher?.detail?.en?.toLowerCase().includes(query) ||
        code.user?.username?.toString()?.toLowerCase().includes(query)
    );
};

const sortItems = (items: EvoucherCode[], descriptor: SortDescriptor) => {
    return [...items].sort((a, b) => {
        let first: string;
        let second: string;

        // Handle special cases for nested objects
        switch (descriptor.column) {
            case "evoucher":
                first = a.evoucher?.acronym || "";
                second = b.evoucher?.acronym || "";
                break;
            case "sponsor":
                first = a.evoucher?.sponsors?.name.en || "" ;
                second = b.evoucher?.sponsors?.name.en || "";
                break;
            case "user":
                first = a.user?.username?.toString() || "";
                second = b.user?.username?.toString() || "";
                break;
            default:
                first = String(a[descriptor.column as keyof EvoucherCode] || "");
                second = String(b[descriptor.column as keyof EvoucherCode] || "");
        }

        const cmp = first < second ? -1 : first > second ? 1 : 0;
        return descriptor.direction === "descending" ? -cmp : cmp;
    });
};

const paginateItems = (items: EvoucherCode[], page: number, rowsPerPage: number) => {
    const start = (page - 1) * rowsPerPage;
    return items.slice(start, start + rowsPerPage);
};

interface UseEvoucherCodeTableProps {
    evoucherCodes: EvoucherCode[];
    rowsPerPage?: number;
    onDataChange?: () => void; // Callback to notify parent of data changes
}

export function useEvoucherCodeTable({ evoucherCodes, rowsPerPage = 5, onDataChange }: UseEvoucherCodeTableProps) {
    const { createEvoucherCode, updateEvoucherCode, deleteEvoucherCode } = useEvoucherCode();

    // State
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set<string>());
    const [typeFilter, setTypeFilter] = useState<Selection>("all");
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "code",
        direction: "ascending",
    });
    const [page, setPage] = useState(1);
    const [actionText, setActionText] = useState<"Add" | "Edit">("Add");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [localEvoucherCodes, setLocalEvoucherCodes] = useState<EvoucherCode[]>(evoucherCodes);

    // Update local state when props change
    useMemo(() => {
        setLocalEvoucherCodes(evoucherCodes);
    }, [evoucherCodes]);

    // Computed values
    const filteredItems = useMemo(() => 
        filterValue ? filterItems(localEvoucherCodes, filterValue) : localEvoucherCodes, 
        [localEvoucherCodes, filterValue]
    );

    const sortedItems = useMemo(() => 
        sortItems(filteredItems, sortDescriptor), 
        [filteredItems, sortDescriptor]
    );

    const pagedItems = useMemo(() => 
        paginateItems(sortedItems, page, rowsPerPage), 
        [sortedItems, page, rowsPerPage]
    );

    const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

    // Handlers
    const handleAdd = async (formData: FormData) => {
        try {
            const response = await createEvoucherCode(formData);
            setIsModalOpen(false);

            if (response?.data?.data) {
                const newEvoucherCode = response.data.data;
                setLocalEvoucherCodes(prev => [...prev, newEvoucherCode]);
                onDataChange?.();

                addToast({
                    title: "Add Successfully",
                    description: "Data has been added successfully",
                });
            }
        } catch (error) {
            addToast({
                title: "Failed to Add",
                description: (error as Error)?.message || "An error occurred while adding data.",
                color: "danger",
            });
        }
    };

    const handleUpdate = async (evoucherCodeId: string, formData: FormData) => {
        try {
            const response = await updateEvoucherCode(evoucherCodeId, formData);
            setIsModalOpen(false);

            if (response?.data?.data) {
                const updatedEvoucherCode = response.data.data;
                setLocalEvoucherCodes(prev => 
                    prev.map(code => code._id === evoucherCodeId ? updatedEvoucherCode : code)
                );
                onDataChange?.();

                addToast({
                    title: "Update Successfully",
                    description: "Data has been updated successfully",
                });
            }
        } catch (error) {
            addToast({
                title: "Failed to Update",
                description: (error as Error)?.message || "An error occurred while updating data.",
                color: "danger",
            });
        }
    };

    const handleDelete = async (evoucherCodeId: string) => {
        try {
            const response = await deleteEvoucherCode(evoucherCodeId);
            setIsDeleteOpen(false);
            
            if (response) {
                // Update local state
                setLocalEvoucherCodes(prev => prev.filter(code => code._id !== evoucherCodeId));
                onDataChange?.();

                addToast({
                    title: "Delete Successfully",
                    description: "Data has been deleted successfully",
                });
            }
        } catch (error) {
            addToast({
                title: "Failed to Delete",
                description: (error as Error)?.message || "An error occurred while deleting data.",
                color: "danger",
            });
        }
    };

    const handleSearch = (val: string) => {
        setFilterValue(val);
        setPage(1);
    };

    const handleClear = () => {
        setFilterValue("");
        setPage(1);
    };

    const handlePreviousPage = () => setPage(prev => Math.max(1, prev - 1));
    const handleNextPage = () => setPage(prev => prev + 1);

    const handleEdit = () => {
        setActionText("Edit");
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setActionText("Add");
        setIsModalOpen(true);
    };

    return {
        // State
        filterValue,
        selectedKeys,
        typeFilter,
        sortDescriptor,
        page,
        actionText,
        isModalOpen,
        isDeleteOpen,
        
        // Computed
        filteredItems,
        sortedItems,
        pagedItems,
        pages,
        
        // Setters
        setSelectedKeys,
        setTypeFilter,
        setSortDescriptor,
        setPage,
        setIsModalOpen,
        setIsDeleteOpen,
        
        // Handlers
        handleAdd,
        handleUpdate,
        handleDelete,
        handleSearch,
        handleClear,
        handlePreviousPage,
        handleNextPage,
        handleEdit,
        handleAddNew,
    };
} 