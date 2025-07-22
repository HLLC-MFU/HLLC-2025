"use client";

import type { Problem } from "@/types/report";

import { Select, SelectItem } from "@heroui/react";

interface StatusDropdownProps {
    status: Problem["status"];
    onChange: (newStatus: Problem["status"]) => void;
}

const STATUS_OPTIONS = [
    { key: "pending", label: "Pending", color: "danger", colorClass: "text-red-500" },
    { key: "in-progress", label: "In-Progress", color: "warning", colorClass: "text-yellow-500" },
    { key: "done", label: "Done", color: "success", colorClass: "text-green-500" },
];

const getStatusColor = (status: Problem["status"]) => {
    switch (status) {
        case "pending": return "danger";
        case "in-progress": return "warning";
        case "done": return "success";
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
            className={`w-[140px] font-medium ${textColorClass}`}
            color={selectedColor}
            label="Status"
            selectedKeys={[status]}
            size="sm"
            onChange={(e) => onChange(e.target.value as Problem["status"])}
        >
            {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.key} textValue={option.label}>
                    <span className={option.colorClass}>{option.label}</span>
                </SelectItem>
            ))}
        </Select>
    );
}