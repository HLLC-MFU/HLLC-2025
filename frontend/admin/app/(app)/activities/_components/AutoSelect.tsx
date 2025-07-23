"use client";

import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { ReactNode } from "react";

type AutoSelectProps = {
    label: string;
    items: { _id: string; label: ReactNode }[];
    selectedIds: string[];
    onAdd: (id: string) => void;
    onRemove: (id: string) => void;
    placeholder?: string;
};

export default function AutoSelect({
    label,
    items,
    selectedIds,
    onAdd,
    onRemove,
    placeholder = "เลือกเพิ่มได้หลายตัว",
}: AutoSelectProps) {
    const filteredItems = items.filter((item) => !selectedIds.includes(item._id));

    return (
        <div className="space-y-2">
            <Autocomplete
                label={label}
                selectedKey={null}
                onSelectionChange={(key) => {
                    if (key && typeof key === "string") {
                        onAdd(key);
                    }
                }}
                variant="bordered"
                placeholder={placeholder}
            >
                {filteredItems.map((item) => (
                    <AutocompleteItem key={item._id}>{item.label}</AutocompleteItem>
                ))}
            </Autocomplete>
            <div className="flex flex-wrap gap-2">
                {selectedIds.map((id) => {
                    const item = items.find((item) => item._id === id);
                    return (
                        <div
                            key={id}
                            className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                            {item?.label}
                            <button
                                onClick={() => onRemove(id)}
                                className="text-primary-500 hover:text-primary-700"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
