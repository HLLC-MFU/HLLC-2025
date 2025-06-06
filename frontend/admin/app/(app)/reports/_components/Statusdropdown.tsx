"use client";

import { Select, SelectItem } from "@heroui/react";
import type { Problem } from "@/types/report";

interface StatusDropdownProps {
    status: Problem["status"];
    onChange: (newStatus: Problem["status"]) => void;
}

const STATUS_OPTIONS = [
    { key: "Pending", label: "Pending", color: "danger", colorClass: "text-red-500" },
    { key: "In-Progress", label: "In-Progress", color: "warning", colorClass: "text-yellow-500" },
    { key: "Done", label: "Done", color: "success", colorClass: "text-green-500" },
];

const getStatusColor = (status: Problem["status"]) => {
    switch (status) {
        case "Pending": return "danger";
        case "In-Progress": return "warning";
        case "Done": return "success";
        default: return "danger";
    }
};

const getTextColorClass = (status: Problem["status"]) => {
    const found = STATUS_OPTIONS.find((opt) => opt.key === status);
    return found ? found.colorClass : "text-gray-500";
};

export default function StatusDropdown({ status, onChange }: StatusDropdownProps) {
    const selectedColor = getStatusColor(status);
    const textColorClass = getTextColorClass(status);

    return (
        <Select
            selectedKeys={[status]}
            onChange={(e) => onChange(e.target.value as Problem["status"])}
            size="sm"
            color={selectedColor}
            label="Status"
            className={`w-[140px] font-medium ${textColorClass}`}
        >
            {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.key} textValue={option.label}>
                    <span className={option.colorClass}>{option.label}</span>
                </SelectItem>
            ))}
        </Select>
    );
}