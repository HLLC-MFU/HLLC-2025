"use client";

import { Button, Input, Select, SelectItem } from "@heroui/react";

interface CampaignFilterProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSortByChange: (value: string) => void;
  onSortDirectionToggle: () => void;
  onAddCampaign: () => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const CampaignFilter = ({
  searchQuery,
  onSearchQueryChange,
  sortBy,
  sortDirection,
  onSortByChange,
  onSortDirectionToggle,
  onAddCampaign,
  statusFilter,
  onStatusFilterChange,
}: CampaignFilterProps) => {
  return (
    <div className="flex flex-row items-center gap-4">
      <Input
        label="Search Campaigns"
        placeholder="Search by name or description..."
        value={searchQuery}
        onChange={(e) => onSearchQueryChange(e.target.value)}
        className="w-64"
      />
      <Select
        label="Status"
        selectedKeys={[statusFilter]}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="w-40"
      >
        <SelectItem key="all">All Status</SelectItem>
        <SelectItem key="draft">Draft</SelectItem>
        <SelectItem key="active">Active</SelectItem>
        <SelectItem key="completed">Completed</SelectItem>
      </Select>
      <Select
        label="Sort By"
        selectedKeys={[sortBy]}
        onChange={(e) => onSortByChange(e.target.value)}
        className="w-40"
      >
        <SelectItem key="name">Name</SelectItem>
        <SelectItem key="startDate">Start Date</SelectItem>
        <SelectItem key="endDate">End Date</SelectItem>
        <SelectItem key="budget">Budget</SelectItem>
      </Select>
      <Button
        variant="flat"
        onPress={onSortDirectionToggle}
        className="min-w-[100px]"
      >
        {sortDirection === "asc" ? "↑ Ascending" : "↓ Descending"}
      </Button>
      <Button
        color="primary"
        onPress={onAddCampaign}
        className="ml-auto"
      >
        Add Campaign
      </Button>
    </div>
  );
}; 