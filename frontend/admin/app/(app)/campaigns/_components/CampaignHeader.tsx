import { Plus, TrendingUp } from "lucide-react";

interface CampaignHeaderProps {
  onAddCampaign: () => void;
}

export const CampaignHeader = ({ onAddCampaign }: CampaignHeaderProps) => {
  return (
    <div className=" border-b border-white/20 dark:border-gray-700/20 top-0 z-10">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Campaign Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and track your marketing campaigns</p>
            </div>
          </div>
          
          <button
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            onClick={onAddCampaign}
          >
            <Plus className="w-5 h-5" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 