"use client";

import { useMemo, useState } from "react";
import { CampaignFilter } from "./_components/CampaignFilter";
import { CampaignCreateDialog } from "./_components/CampaignCreateDialog";
import { CampaignUpdateDialog } from "./_components/CampaignUpdateDialog";
import { DeleteConfirmationModal } from "./_components/DeleteConfirmationModal";
import { CampaignPreview } from "./_components/CampaignPreview";
import { Campaign } from "@/types/campaign";
import { useCampaigns } from "@/hooks/useCampaign";
import { Plus, Search, Filter, Grid, List, TrendingUp } from "lucide-react";

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

    console.log("Final sorted campaigns:", sorted);
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
      await fetchCampaigns(); // Fetch campaigns after create
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  const handleUpdateSuccess = async (formData: FormData) => {
    try {
      if (selectedCampaign) {
        await updateCampaign(selectedCampaign._id, formData);
        await fetchCampaigns(); // Fetch campaigns after update
        setIsUpdateModalOpen(false);
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCampaign) {
      deleteCampaign(selectedCampaign._id);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteSuccess = async () => {
    try {
      await fetchCampaigns(); // Fetch campaigns after delete
    } catch (error) {
      console.error("Error fetching campaigns after delete:", error);
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
    <div className="min-h-screen ">
      {/* Header Section */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Campaign Management
                </h1>
                <p className="text-gray-600 mt-1">Manage and track your marketing campaigns</p>
              </div>
            </div>
            
            <button
              onClick={handleAddCampaign}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-purple-600 flex items-center justify-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  ${stats.totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">$</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CampaignFilter
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortByChange={setSortBy}
              onSortDirectionToggle={() =>
                setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              onAddCampaign={handleAddCampaign}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading campaigns...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your data</p>
          </div>
        ) : filteredAndSortedCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No campaigns found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "Get started by creating your first campaign"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={handleAddCampaign}
                className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Create Your First Campaign
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
         

{(() => {
  console.log("filteredAndSortedCampaigns:", filteredAndSortedCampaigns);
  return filteredAndSortedCampaigns.map((campaign: Campaign) => {
    console.log("Rendering campaign:", campaign);
    return (
      <div 
        key={campaign._id} 
        className="group relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 overflow-hidden min-h-[300px]"
      >
        {/* Campaign Preview Content */}
        <CampaignPreview campaign={campaign} />
        
        {/* Enhanced Action Buttons */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditCampaign(campaign);
              }}
              className="p-2 bg-blue-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
              title="Edit Campaign"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCampaign(campaign);
              }}
              className="p-2 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
              title="Delete Campaign"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  });
})()}
          </div>
        )}
      </div>

      {/* Modals */}
      <CampaignCreateDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <CampaignUpdateDialog
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={handleUpdateSuccess}
        campaign={selectedCampaign}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        campaign={selectedCampaign}
      />
    </div>
  );
}