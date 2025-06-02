"use client";
import { useMemo, useState } from "react";
import { SponsorFilters } from "./_components/SponsorFilters";
import { SponsorModal } from "./_components/SponsorModal";
import { SponsorCard } from "./_components/SponsorCard";

export default function SponsorPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddSponsor = () => {
        setModalMode("add");
        setIsModalOpen(true);
    };


    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Sponsor Page</h1>
                </div>
                <div className="flex flex-col gap-6">
                    <SponsorFilters
                        searchQuery={searchQuery}
                        onSearchQueryChange={setSearchQuery}
                        onAddSponsor={handleAddSponsor}
                    />
                </div>
            </div>
            <SponsorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                onSuccess={(sponsor, mode) => {
                    console.log("Done", sponsor, mode);
                }}
            />
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
                    <SponsorCard
                        sponsor={{
                            _id: "s1",
                            name: { en: "Google ", th: "กูเกิล" },
                            description: {
                                en: "Tech company Google was founded on September 4, 1998, by American computer scientists Larry Page and Sergey Brin...",
                                th: "บริษัทเทคโนโลยี"
                            },
                            logo: {
                                first: "https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png",
                                second: "https://logo.clearbit.com/google.com",
                                third: "https://logo.clearbit.com/google.com",
                                fourth: "https://logo.clearbit.com/google.com"
                            },
                            type: "Tech",
                            isShow: true
                        }}
                        onEdit={(s) => console.log("Edit sponsor:", s)}
                        onDelete={(s) => console.log("Delete sponsor:", s)}
                    />
                </div>
            </div>
        </div>
    );
}