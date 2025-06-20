"use client";

import { useMemo, useState } from "react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { DollarSignIcon, Plus } from "lucide-react";

import { useSponsors } from "@/hooks/useSponsors";
import { SponsorFilters } from "./_components/SponsorFilters";
import SponsorTable from "./_components/SponsorTable";
import AddSponsorTypeModal from "./_components/AddSponsorTypeModal";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { Sponsors } from "@/types/sponsors";
import { useSponsorsType } from "@/hooks/useSponsorsType";
import { PageHeader } from "@/components/ui/page-header";

export default function SponsorPage() {
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsors | Partial<Sponsors>>();
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [confirmationModalType, setConfirmationModalType] = useState<"delete" | "edit" | null>(null);

  const {
    sponsors,
    loading: sponsorsLoading,
    createSponsors,
    updateSponsors,
    deleteSponsors,
    fetchSponsors,
  } = useSponsors();

  const {
    sponsorsType,
    createSponsorsType,
  } = useSponsorsType();

  const groupedSponsors = useMemo(() => {
    const groups: Record<string, Sponsors[]> = {};

    sponsorsType.forEach((type) => {
      groups[type.name] = [];
    });

    sponsors?.forEach((s) => {
      const typeName =
        typeof s.type === "object" && s.type !== null && "name" in s.type
          ? (s.type as { name: string }).name
          : s.type || "Unknown";
      if (!groups[typeName]) groups[typeName] = [];
      groups[typeName].push(s);
    });

    return groups;
  }, [sponsors, sponsorsType]);

  const handleSearchQueryChange = (type: string, value: string) => {
    setSearchQueries((prev) => ({ ...prev, [type]: value }));
  };

  const getFilteredSortedSponsors = (sponsors: Sponsors[], type: string): Sponsors[] => {
    let filtered = [...sponsors];
    const search = searchQueries[type]?.toLowerCase() ?? "";

    if (search.trim() !== "") {
      filtered = filtered.filter(
        (s) =>
          s.name?.en?.toLowerCase().includes(search) ||
          s.name?.th?.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.name?.en ?? "").localeCompare(b.name?.en ?? "");
          break;
        case "type":
          comparison = String(a.type ?? "").localeCompare(String(b.type ?? ""));
          break;
        case "isShow":
          comparison = Number(a.isShow ?? 0) - Number(b.isShow ?? 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleAddSponsor = () => {
    setModalMode("add");
    setSelectedSponsor(undefined);
    setIsModalOpen(true);
  };

  const handleEditSponsor = (sponsor: Sponsors) => {
    setModalMode("edit");
    setSelectedSponsor(sponsor);
    setIsModalOpen(true);
  };

  const handleDeleteSponsor = (sponsor: Sponsors) => {
    setSelectedSponsor(sponsor);
    setConfirmationModalType("delete");
  };

  const handleSubmitSponsor = async (sponsorsData: FormData) => {
    let response;
    // const formData = new FormData();

    // if (sponsorsData.name) {
    //   if (sponsorsData.name.th) formData.append("name[th]", sponsorsData.name.th);
    //   if (sponsorsData.name.en) formData.append("name[en]", sponsorsData.name.en);
    // }

    // const input = document.querySelector<HTMLInputElement>("#photo-input");
    // const file = input?.files?.[0];
    // if (file) {
    //   formData.append("photo", file);
    // }

    // if (sponsorsData.type && sponsorsData.type._id !== "") {
    //   formData.append("type", sponsorsData.type._id);
    // }
    // if (typeof sponsorsData.isShow === "boolean") {
    //   formData.append("isShow", String(sponsorsData.isShow));
    // }

    if (modalMode === "add") {
      response = await createSponsors(sponsorsData);
    } else if (modalMode === "edit" && selectedSponsor?._id) {
      response = updateSponsors(selectedSponsor._id, sponsorsData);
    }

    setIsModalOpen(false);
    if (response) await fetchSponsors();
  };

  const handleConfirm = async () => {
    if (selectedSponsor?._id) {
      await deleteSponsors(selectedSponsor._id);
      await fetchSponsors();
    }
    setConfirmationModalType(null);
    setSelectedSponsor(undefined);
  };

  const handleAddType = async (type: { name: string }) => {
    await createSponsorsType(type);
    setIsTypeOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto">
        <PageHeader
          title="Sponsor Management"
          description="This is Sponsor page"
          icon={<DollarSignIcon />}
          right={
            <div className="w-full sm:w-auto">
              <Button
                color="primary"
                endContent={<Plus size={20} />}
                size="lg"
                onPress={() => setIsTypeOpen(true)}
              >
                New sponsor type
              </Button>
            </div>
          }
        />

        <Accordion variant="splitted">
          {Object.entries(groupedSponsors).map(([type, sponsors]) => {
            const filtered = getFilteredSortedSponsors(sponsors, type);

            return (
              <AccordionItem
                key={type}
                aria-label={type}
                title={`${type}`}
                subtitle={
                  <p className="flex">
                    Total sponsors:{" "}
                    <span className="text-primary ml-1">{sponsors.length}</span>
                  </p>
                }
              >
                <div className="flex flex-col gap-6 p-4 sm:p-6 w-full overflow-x-auto">
                  <SponsorFilters
                    searchQuery={searchQueries[type] ?? ""}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onAddSponsor={handleAddSponsor}
                    onSearchQueryChange={(v) => handleSearchQueryChange(type, v)}
                    onSortByChange={setSortBy}
                    onSortDirectionToggle={toggleSortDirection}
                  />

                  {filtered.length === 0 && !sponsorsLoading && (
                    <p className="text-center text-sm text-default-500">
                      No sponsors found. Please add a new sponsor.
                    </p>
                  )}

                  <div className="w-full overflow-x-auto">
                    <SponsorTable
                      type={type}
                      sponsorTypes={sponsorsType}
                      isModalOpen={isModalOpen}
                      onClose={() => setIsModalOpen(false)}
                      modalMode={modalMode}
                      selectedSponsor={selectedSponsor}
                      handleSubmitSponsor={handleSubmitSponsor}
                      sponsors={filtered}
                      onEdit={handleEditSponsor}
                      onDelete={handleDeleteSponsor}
                      onToggleShow={(s) => {
                        const formData = new FormData();
                        formData.append("isShow", String(!s.isShow));
                        updateSponsors(s._id, formData);
                      }}
                    />
                  </div>
                </div>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <AddSponsorTypeModal
        isOpen={isTypeOpen}
        onClose={() => setIsTypeOpen(false)}
        onAddType={handleAddType}
      />

      <ConfirmationModal
        body={
          confirmationModalType === "edit"
            ? `Are you sure you want to save the changes for "${selectedSponsor?.name?.en}"?`
            : `Are you sure you want to delete the sponsor "${selectedSponsor?.name?.en}"? This action cannot be undone.`
        }
        confirmColor={confirmationModalType === "edit" ? "primary" : "danger"}
        confirmText={confirmationModalType === "edit" ? "Save" : "Delete"}
        isOpen={confirmationModalType !== null}
        title={
          confirmationModalType === "edit" ? "Save Sponsor" : "Delete Sponsor"
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
