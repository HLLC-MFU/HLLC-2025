import { Sponsor } from "@/types/sponsor";
import { SponsorSkeleton } from "./SponsorSkeleton";
import { SponsorCard } from "./SponsorCard";

interface SponsorListProps {
    sponsor?: Sponsor[];
    isLoading: boolean;
    onEditSponsor: (sponsor: Sponsor) => void;
    onDeleteSponsor: (sponsor: Sponsor) => void;
}

export function SponsorList({ sponsor, isLoading, onEditSponsor, onDeleteSponsor }: SponsorListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg-grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <SponsorSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsor?.map((sponsor, index) => (
                <SponsorCard
                    key={sponsor._id ?? `sponsor-${index}`}
                    sponsor={sponsor}
                    onEdit={onEditSponsor}
                    onDelete={onDeleteSponsor}
                />
            ))}
        </div>
    );
}