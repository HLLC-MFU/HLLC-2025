import { Campaign } from "@/types/campaign";
import { CampaignPreview } from "./CampaignPreview";
import { Search } from "lucide-react";

interface CampaignListProps {
  campaigns: Campaign[];
  loading: boolean;
  viewMode: "grid" | "list";
  searchQuery: string;
  statusFilter: string;
  onEditCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaign: Campaign) => void;
  onAddCampaign: () => void;
}

export const CampaignList = ({
  campaigns,
  loading,
  viewMode,
  searchQuery,
  statusFilter,
  onEditCampaign,
  onDeleteCampaign,
  onAddCampaign,
}: CampaignListProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading campaigns...</p>
        <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your data</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
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
            onClick={onAddCampaign}
            className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Create Your First Campaign
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={
      viewMode === "grid" 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
    }>
      {campaigns.map((campaign) => (
        <div 
          key={campaign._id} 
          className="group relative bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 overflow-hidden min-h-[300px]"
        >
          <CampaignPreview campaign={campaign} />
          
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCampaign(campaign);
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
                  onDeleteCampaign(campaign);
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
      ))}
    </div>
  );
}; 