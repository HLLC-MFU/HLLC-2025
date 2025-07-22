import { Landmark } from "@/types/coin-hunting";
import { Input, Select, SelectItem } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import React from "react";

type TopContentSponsorProps = {
    filterValue: string;
    onClear: () => void;
    onSearchChange: (value: string) => void;
    landmark: Landmark[];
    selectedLandmarkId: string | null;
    onLandmarkChange: (id: string) => void;
}

export default function TopContentSponsor({
    filterValue,
    onClear,
    onSearchChange,
    landmark,
    selectedLandmarkId,
    onLandmarkChange,
}: TopContentSponsorProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-center">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search user"
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={onClear}
                    onValueChange={onSearchChange}
                />

                <Select
                    label="Select Landmark"
                    selectedKeys={selectedLandmarkId ? new Set([selectedLandmarkId]) : new Set()}
                    onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        if (selected) onLandmarkChange(String(selected));
                    }}
                >
                    {landmark.map((lm) => (
                        <SelectItem key={lm._id} textValue={lm.name.en}>
                            {lm.name.en ?? lm.name.th}
                        </SelectItem>
                    ))}
                </Select>
            </div>
        </div>
    )
};
