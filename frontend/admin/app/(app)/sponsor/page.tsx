"use client";
import { useMemo, useState } from "react";
import { SponsorFilters } from "./_components/SponsorFilters";
import { SponsorList } from "./_components/SponsorList";
import { SponsorModal } from "./_components/SponsorModal";
import { SponsorCard } from "./_components/SponsorCard";
import type { Sponsor } from "@/types/sponsor";
import { useSponsor } from "@/hooks/useSponsor";
import { addToast } from "@heroui/react";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";


export default function SponsorPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSponsor, setSelectedSponsor] = useState<
        Sponsor | Partial<Sponsor> | undefined
    >();
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [confirmationModalType, setConfirmationModalType] = useState<
        'delete' | 'edit' | null
    >(null);

    const { sponsor, loading, createSponsor, updateSponsor, deleteSponsor } =
        useSponsor();

    const filteredAndSortedSponsor = useMemo(() => {
        if (!sponsor) return [];

        let filtered = sponsor;

        if (searchQuery.trim() !== '') {
            const lower = searchQuery.toLowerCase();

            filtered = sponsor.filter(
                (s) =>
                    s.name?.en?.toLowerCase().includes(lower) ||
                    s.name?.th?.toLowerCase().includes(lower),
            );
        }

        return filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = (a.name?.en ?? '').localeCompare(b.name?.en ?? '');
                    break;
                case 'type':
                    comparison = String(a.type ?? '').localeCompare(String(b.type ?? ''));
                    break;
                case 'isShow':
                    comparison = Number(a.isShow ?? 0) - Number(b.isShow ?? 0);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [sponsor, searchQuery, sortBy, setSortDirection]);

    const toggleSortDirection = () => {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    };

    const handleAddSponsor = () => {
        setModalMode('add');
        setSelectedSponsor(undefined);
        setIsModalOpen(true);
    };

    const handleEditSponsor = (sponsor: Sponsor) => {
        setModalMode('edit');
        setSelectedSponsor(sponsor);
        setIsModalOpen(true);
    };

    const handleDeleteSponsor = (sponsor: Sponsor) => {
        setSelectedSponsor(sponsor);
        setConfirmationModalType('delete');
    };

    const handleSubmitSchool = (sponsorData: Partial<Sponsor>) => {
        if (selectedSponsor && ' _id' in selectedSponsor && selectedSponsor._id) {
            setSelectedSponsor({ ...selectedSponsor, ...sponsorData });
            setConfirmationModalType('edit');
        } else {
            createSponsor(sponsorData);
            addToast({
                title: 'Sponsor added successfully!',
                color: 'success',
            });
        }
        setIsModalOpen(false);
    };

    const handleConfirm = () => {
        if (
            confirmationModalType === 'delete' &&
            selectedSponsor &&
            selectedSponsor._id
        ) {
            deleteSponsor(selectedSponsor._id);
            addToast({
                title: 'Sponsor deleted successfully!',
                color: 'success',
            });
        } else if (
            confirmationModalType === 'edit' &&
            selectedSponsor &&
            selectedSponsor._id
        ) {
            updateSponsor(selectedSponsor._id, selectedSponsor);
            addToast({
                title: 'Sponsor updated successfully!',
                color: 'success',
            });
        }
        setConfirmationModalType(null);
        setSelectedSponsor(undefined);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Sponsor Management</h1>
                </div>
                <div className="flex flex-col gap-6">
                    <SponsorFilters
                        searchQuery={searchQuery}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onAddSponsor={handleAddSponsor}
                        onSearchQueryChange={setSearchQuery}
                        onSortByChange={setSortBy}
                        onSortDirectionToggle={toggleSortDirection}
                    />
                    {filteredAndSortedSponsor.length === 0 && !loading && (
                        <p className="text-center text-sm text-default-500">
                            No sponsors found. Please add a new sponsor.
                        </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
                        {filteredAndSortedSponsor.map((sponsor) => (
                            <SponsorCard
                                key={sponsor._id}
                                sponsor={sponsor}
                                onEdit={handleEditSponsor}
                                onDelete={handleDeleteSponsor}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <SponsorModal
                isOpen={isModalOpen}
                mode={modalMode}
                sponsor={
                    selectedSponsor && '_id' in selectedSponsor
                        ? (selectedSponsor as Sponsor)
                        : undefined
                }
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSubmitSchool}
            />

            <ConfirmationModal
                body={
                    confirmationModalType === 'edit'
                        ? `Are you sure you want to save the changes for "${selectedSponsor?.name?.en}"?`
                        : `Are you sure you want to delete the sponsor "${selectedSponsor?.name?.en}"? This action cannot be undone.`
                }
                confirmColor={confirmationModalType === 'edit' ? 'primary' : 'danger'}
                confirmText={confirmationModalType === 'edit' ? 'Save' : 'Delete'}
                isOpen={confirmationModalType !== null}
                title={
                    confirmationModalType === 'edit' ? 'Save Sponsor' : 'Delete Sponsor'
                }
                onClose={() => {
                    setConfirmationModalType(null);
                    setSelectedSponsor(undefined);
                }}
                onConfirm={handleConfirm}
            />
        </div>
    );
}

// export default function SponsorPage() {
//     const [sponsors, setSponsors] = useState<Sponsor[]>([
//         {
//             _id: "s1",
//             name: { en: "Google", th: "กูเกิล" },
//             description: {
//                 en: "Tech company Google was founded on September 4, 1998, by American computer scientists Larry Page and Sergey Brin...",
//                 th: "บริษัทเทคโนโลยี"
//             },
//             logo: {
//                 first: "https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png",
//                 second: "",
//                 third: "",
//                 fourth: ""
//             },
//             type: "Tech",
//             isShow: true
//         },
//         {
//             _id: "s2",
//             name: { en: "Facebook", th: "เฟสสะบุ้ค" },
//             description: {
//                 en: "Tech company Google was founded on September 4, 1998, by American computer scientists Larry Page and Sergey Brin...",
//                 th: "บริษัทเทคโนโลยี"
//             },
//             logo: {
//                 first: "data:image/png;base64,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",
//                 second: "",
//                 third: "",
//                 fourth: ""
//             },
//             type: "Commu",
//             isShow: false
//         },
//         {
//             _id: "s3",
//             name: { en: "Nasa", th: "ก็พาเธอกลับมาไม่ได้" },
//             description: {
//                 en: "Tech company Google was founded on September 4, 1998, by American computer scientists Larry Page and Sergey Brin...",
//                 th: "บริษัทเทคโนโลยี"
//             },
//             logo: {
//                 first: "https://images.seeklogo.com/logo-png/9/1/nasa-logo-png_seeklogo-97034.png",
//                 second: "",
//                 third: "",
//                 fourth: ""
//             },
//             type: "World",
//             isShow: true
//         },
//         {
//             _id: "s4",
//             name: { en: "Instagram", th: "IG" },
//             description: {
//                 en: "Tech company Google was founded on September 4, 1998, by American computer scientists Larry Page and Sergey Brin...",
//                 th: "บริษัทเทคโนโลยี"
//             },
//             logo: {
//                 first: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
//                 second: "",
//                 third: "",
//                 fourth: ""
//             },
//             type: "Commu",
//             isShow: false
//         }
//     ]);
//     const [searchQuery, setSearchQuery] = useState("");
//     const [sortBy, setSortBy] = useState<string>("name");
//     const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
//     const [modalMode, setModalMode] = useState<"add" | "edit">("add");
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);

//     const toggleSortDirection = () => {
//         setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
//     };

//     const filteredAndSortedSponsor = useMemo(() => {
//         let filtered = sponsors;
//         if (searchQuery.trim() !== "") {
//             const lower = searchQuery.toLowerCase();
//             filtered = sponsors.filter(
//                 (s) =>
//                     s.name?.en?.toLowerCase().includes(lower) ||
//                     s.name?.th?.toLowerCase().includes(lower)
//             );
//         }

//         return filtered.sort((a, b) => {
//             let comparison = 0;
//             if (sortBy === "name") {
//                 comparison = (a.name?.en ?? "").localeCompare(b.name?.en ?? "");
//             } else if (sortBy === "type") {
//                 comparison = String(a.type ?? "").localeCompare(String(b.type ?? ""));
//             } else if (sortBy === "isShow") {
//                 comparison = String(a.isShow ?? "").localeCompare(String(b.isShow ?? ""));
//             }
//             return sortDirection === "asc" ? comparison : -comparison;
//         });
//     }, [sponsors, searchQuery, sortBy, sortDirection]);

//     const handleAddSponsor = () => {
//         setModalMode("add");
//         setSelectedSponsor(null);
//         setIsModalOpen(true);
//     };

//     const handleEditSponsor = (sponsor: Sponsor) => {
//         setModalMode("edit");
//         setSelectedSponsor(sponsor);
//         setIsModalOpen(true);
//     };

//     const handleDeleteSponsor = (sponsor: Sponsor) => {
//         setSponsors((prev) => prev.filter((s) => s._id !== sponsor._id));
//     };

//     const handleModalSuccess = (sponsor: Partial<Sponsor>, mode: "add" | "edit") => {
//         if (!sponsor._id) {
//             // Optionally handle error or generate a new ID for 'add' mode
//             return;
//         }
//         if (mode === "add") {
//             setSponsors((prev) => [...prev, sponsor as Sponsor]);
//         } else {
//             setSponsors((prev) =>
//                 prev.map((s) => (s._id === sponsor._id ? (sponsor as Sponsor) : s))
//             );
//         }
//         setIsModalOpen(false);
//     };

//     return (
//         <div className="flex flex-col min-h-screen">
//             <div className="container mx-auto px-4">
//                 <div className="flex items-center justify-between mb-8">
//                     <h1 className="text-3xl font-bold">Sponsor Page</h1>
//                 </div>
//                 <div className="flex flex-col gap-6">
//                     <SponsorFilters
//                         searchQuery={searchQuery}
//                         onSearchQueryChange={setSearchQuery}
//                         sortBy={sortBy}
//                         sortDirection={sortDirection}
//                         onSortByChange={setSortBy}
//                         onSortDirectionToggle={toggleSortDirection}
//                         onAddSponsor={handleAddSponsor}
//                     />
//                 </div>
//             </div>

//             <SponsorModal
//                 isOpen={isModalOpen}
//                 onClose={() => setIsModalOpen(false)}
//                 mode={modalMode}
//                 sponsor={selectedSponsor ?? undefined}
//                 onSuccess={handleModalSuccess}
//             />

//             <div className="container mx-auto px-4">
//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
//                     {filteredAndSortedSponsor.map((sponsor) => (
//                         <SponsorCard
//                             key={sponsor._id}
//                             sponsor={sponsor}
//                             onEdit={handleEditSponsor}
//                             onDelete={handleDeleteSponsor}
//                         />
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }
