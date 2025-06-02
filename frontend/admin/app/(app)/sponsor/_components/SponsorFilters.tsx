import { PlusIcon, SearchIcon } from "lucide-react";
import { Button, Input } from "@heroui/react";


interface SponsorFiltersProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    onAddSponsor: () => void;
}

export function SponsorFilters({
    searchQuery,
    onSearchQueryChange,
    onAddSponsor
}: SponsorFiltersProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    isClearable
                    value={searchQuery}
                    onValueChange={onSearchQueryChange}
                    className="w-full"
                    placeholder="Search sponsors..."
                    startContent={<SearchIcon className="text-default-400" />}
                />
                <div className="flex gap-2 sm:gap-3">
                    <Button
                        color="primary"
                        endContent={<PlusIcon />}
                        onPress={onAddSponsor}
                        className="border p-2"
                        >
                        Add Sponsor
                    </Button>
                </div>
            </div>
        </div>
    );
}
