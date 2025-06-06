"use client";

import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { Plus } from "lucide-react";

import { useSponsor } from "@/hooks/useSponsor";
import { addToast } from "@heroui/react";

import { SponsorFilters } from "./_components/SponsorFilters";
import SponsorTable from "./_components/SponsorTable";
import AddSponsorTypeModal from "./_components/AddSponsorTypeModal";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { Sponsor } from "@/types/sponsor";


export default function SponsorPage() {
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | Partial<Sponsor>>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [confirmationModalType, setConfirmationModalType] = useState<'delete' | 'edit' | null>(null);

  const {
    sponsor,
    loading,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    sponsorTypes,
    createSponsortype,
  } = useSponsor();

  const groupedSponsors: Record<string, Sponsor[]> = useMemo(() => {
    const groups: Record<string, Sponsor[]> = {};

    sponsorTypes.forEach((type) => {
      groups[type.name] = [];
    });

    sponsor?.forEach((s) => {
      const typeName =
        typeof s.type === "object" && s.type !== null && "name" in s.type
          ? (s.type as { name: string }).name
          : s.type || "Unknown";
      if (!groups[typeName]) groups[typeName] = [];
      groups[typeName].push(s);
    });

    return groups;
  }, [sponsor, sponsorTypes]);

  const getFilteredSortedSponsors = (sponsors: Sponsor[]): Sponsor[] => {
    let filtered = [...sponsors];

    if (searchQuery.trim() !== '') {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.en?.toLowerCase().includes(lower) ||
          s.name?.th?.toLowerCase().includes(lower)
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
  };

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

  const handleSubmitSponsor = (sponsorData: Partial<Sponsor> & { logoFile?: File | null }) => {
    console.log(sponsorData);

    if (selectedSponsor && '_id' in selectedSponsor && selectedSponsor._id) {
      setSelectedSponsor({ ...selectedSponsor, ...sponsorData });
      setConfirmationModalType('edit');
    } else {
      const formData = new FormData();
      Object.entries(sponsorData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "logoFile" && value instanceof File) {
            formData.append("logoPhoto", value); // name must match backend field
          } else if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });

      createSponsor(formData);
      setIsModalOpen(false);
    }
  };


  const handleConfirm = () => {
    if (confirmationModalType === 'delete' && selectedSponsor?._id) {
      deleteSponsor(selectedSponsor._id);
      
    } else if (confirmationModalType === 'edit' && selectedSponsor?._id) {
      const formData = new FormData();
      Object.entries(selectedSponsor).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "logoFile" && value instanceof File) {
            formData.append("logoPhoto", value); // name must match backend field
          } else if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });
      updateSponsor(selectedSponsor._id, formData);
      addToast({
        title: 'Sponsor updated successfully!',
        color: 'success',
      });
    }

    setConfirmationModalType(null);
    setSelectedSponsor(undefined);
  };

  const handleAddType = async (type: { name: string }) => {
    console.log(type);
    await createSponsortype(type);
    setIsTypeOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Sponsor Management</h1>
          <Button
            color="primary"
            endContent={<Plus size={20} />}
            onPress={() => setIsTypeOpen(true)}
          >
            New sponsor type
          </Button>
        </div>

        <Accordion variant="splitted">
          {Object.entries(groupedSponsors).map(([type, sponsors]) => {
            const filtered = getFilteredSortedSponsors(sponsors);

            return (
              <AccordionItem
                key={type}
                aria-label={type}
                title={`${type}`}
                subtitle={
                  <p className="flex">
                    Total sponsors : <span className="text-primary ml-1">{sponsors.length}</span>
                  </p>
                }
              >
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

                  {filtered.length === 0 && !loading && (
                    <p className="text-center text-sm text-default-500">
                      No sponsors found. Please add a new sponsor.
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-4 py-6">
                    <SponsorTable
                      type={type}
                      sponsorTypes={sponsorTypes}
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
                        updateSponsor(s._id, formData);
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
