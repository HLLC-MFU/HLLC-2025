"use client";

import { useMemo, useState } from "react";
import { Grid, List } from "lucide-react";
import { addToast } from "@heroui/react";

import { CampaignFilter } from "./_components/CampaignFilter";
import { CampaignCreateDialog } from "./_components/CampaignCreateDialog";
import { CampaignUpdateDialog } from "./_components/CampaignUpdateDialog";
import { DeleteConfirmationModal } from "./_components/DeleteConfirmationModal";
import { CampaignHeader } from "./_components/CampaignHeader";
import { CampaignStats } from "./_components/CampaignStats";
import { CampaignList } from "./_components/CampaignList";

import { Campaign } from "@/types/campaign";
import { useCampaigns } from "@/hooks/useCampaign";

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | undefined>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { campaigns, loading, createCampaign, updateCampaign, deleteCampaign, fetchCampaigns } = useCampaigns();

  const filteredAndSortedCampaigns = useMemo(() => {
    if (!campaigns) return [];

    let filtered = campaigns;

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const lower = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (campaign: Campaign) =>
          campaign.name.th.toLowerCase().includes(lower) ||
          campaign.detail.th.toLowerCase().includes(lower)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((campaign: Campaign) => campaign.status === statusFilter);
    }

    // Apply sorting
    const sorted = filtered.sort((a: Campaign, b: Campaign) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.th.localeCompare(b.name.th);
          break;
        case "startDate":
          comparison = new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
          break;
        case "endDate":
          comparison = new Date(a.endAt).getTime() - new Date(b.endAt).getTime();
          break;
        case "budget":
          comparison = a.budget - b.budget;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [campaigns, searchQuery, sortBy, sortDirection, statusFilter]);

  const handleAddCampaign = () => {
    setSelectedCampaign(undefined);
    setIsCreateModalOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSuccess = async (formData: FormData) => {
    try {
      await createCampaign(formData);
      await fetchCampaigns();
      addToast({
        title: "สร้างแคมเปญสำเร็จ",
        color: "success",
        description: "แคมเปญถูกสร้างเรียบร้อยแล้ว",
        variant: "solid",
      });
      setIsCreateModalOpen(false);
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      addToast({
        title: "เกิดข้อผิดพลาด",
        color: "danger",
        description: "ไม่สามารถสร้างแคมเปญได้ กรุณาลองใหม่อีกครั้ง",
        variant: "solid",
      });
    }
  };

  const handleUpdateSuccess = async (formData: FormData) => {
    try {
      if (selectedCampaign) {
        await updateCampaign(selectedCampaign._id, formData);
        await fetchCampaigns();
        addToast({
          title: "อัปเดตแคมเปญสำเร็จ",
          color: "success",
          description: "แคมเปญถูกอัปเดตเรียบร้อยแล้ว",
          variant: "solid",
        });
        setIsUpdateModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error updating campaign:", error);
      addToast({
        title: "เกิดข้อผิดพลาด",
        color: "danger",
        description: "ไม่สามารถอัปเดตแคมเปญได้ กรุณาลองใหม่อีกครั้ง",
        variant: "solid",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (selectedCampaign) {
        await deleteCampaign(selectedCampaign._id);
        await fetchCampaigns();
        addToast({
          title: "ลบแคมเปญสำเร็จ",
          color: "success",
          description: "แคมเปญถูกลบเรียบร้อยแล้ว",
          variant: "solid",
        });
        setIsDeleteModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      addToast({
        title: "เกิดข้อผิดพลาด",
        color: "danger",
        description: "ไม่สามารถลบแคมเปญได้ กรุณาลองใหม่อีกครั้ง",
        variant: "solid",
      });
    }
  };

  // Calculate campaign statistics
  const stats = useMemo(() => {
    if (!campaigns) return { total: 0, active: 0, completed: 0, totalBudget: 0 };
    
    return {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
      totalBudget: campaigns.reduce((sum, c) => sum + c.budget, 0)
    };
  }, [campaigns]);

  return (
    <div className="min-h-screen">
      <CampaignHeader onAddCampaign={handleAddCampaign} />

      <div className="container mx-auto px-6 py-8">
        <CampaignStats stats={stats} />

        {/* Enhanced Filter Section */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CampaignFilter
              searchQuery={searchQuery}
              sortBy={sortBy}
              sortDirection={sortDirection}
              statusFilter={statusFilter}
              onAddCampaign={handleAddCampaign}
              onSearchQueryChange={setSearchQuery}
              onSortByChange={setSortBy}
              onSortDirectionToggle={() =>
                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              onStatusFilterChange={setStatusFilter}
            />
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">List</span>
              </button>
            </div>
          </div>
        </div>

        <CampaignList
          campaigns={filteredAndSortedCampaigns}
          loading={loading}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          viewMode={viewMode}
          onAddCampaign={handleAddCampaign}
          onDeleteCampaign={handleDeleteCampaign}
          onEditCampaign={handleEditCampaign}
        />
      </div>

      {/* Modals */}
      <CampaignCreateDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <CampaignUpdateDialog
        campaign={selectedCampaign}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={handleUpdateSuccess}
      />

      <DeleteConfirmationModal
        campaign={selectedCampaign}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}