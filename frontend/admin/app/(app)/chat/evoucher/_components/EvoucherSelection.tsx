"use client";

import { Evoucher } from "@/types/evoucher";
import { 
    Card, 
    CardBody, 
    Button, 
    Input,
    Select,
    SelectItem,
    Divider,
    Badge,
} from "@heroui/react";
import { 
    Calendar,
    Percent,
    Tag,
    ExternalLink,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

interface EvoucherSelectionProps {
    evouchers: Evoucher[];
    selectedEvoucher: Evoucher | null;
    evoucherData: {
        title: string;
        description: string;
        claimURL: string;
    };
    loading: boolean;
    error: string | null;
    onEvoucherSelect: (evoucherId: string) => void;
    onEvoucherDataChange: (data: { title: string; description: string; claimURL: string }) => void;
    onRefresh: () => void;
}

export function EvoucherSelection({
    evouchers,
    selectedEvoucher,
    evoucherData,
    loading,
    error,
    onEvoucherSelect,
    onEvoucherDataChange,
    onRefresh,
}: EvoucherSelectionProps) {
    const isEvoucherExpired = (evoucher: Evoucher): boolean => {
        // Use endAt instead of expiration
        const endDate = evoucher.endAt || evoucher.expiration;
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    const getEvoucherStatusColor = (evoucher: Evoucher) => {
        if (isEvoucherExpired(evoucher)) return "danger";
        // Check if evoucher is active based on startAt and endAt
        const now = new Date();
        const startAt = evoucher.startAt ? new Date(evoucher.startAt) : null;
        const endAt = evoucher.endAt ? new Date(evoucher.endAt) : (evoucher.expiration ? new Date(evoucher.expiration) : null);
        
        if (startAt && endAt && now >= startAt && now <= endAt) return "success";
        return "warning";
    };

    const getEvoucherStatusText = (evoucher: Evoucher) => {
        if (isEvoucherExpired(evoucher)) return "Expired";
        
        const now = new Date();
        const startAt = evoucher.startAt ? new Date(evoucher.startAt) : null;
        const endAt = evoucher.endAt ? new Date(evoucher.endAt) : (evoucher.expiration ? new Date(evoucher.expiration) : null);
        
        if (startAt && endAt && now >= startAt && now <= endAt) return "Active";
        if (startAt && now < startAt) return "Not Started";
        return "Inactive";
    };

    const isEvoucherValid = (evoucher: Evoucher | null): boolean => {
        if (!evoucher) return false;
        if (isEvoucherExpired(evoucher)) return false;
        
        // Check if evoucher is within valid date range
        const now = new Date();
        const startAt = evoucher.startAt ? new Date(evoucher.startAt) : null;
        const endAt = evoucher.endAt ? new Date(evoucher.endAt) : (evoucher.expiration ? new Date(evoucher.expiration) : null);
        
        if (startAt && endAt && (now < startAt || now > endAt)) return false;
        
        // Check claims if available
        if (evoucher.claims && evoucher.claims.currentClaim >= evoucher.claims.maxClaim) return false;
        
        return true;
    };

    return (
        <Card>
            <CardBody>
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Select Evoucher</h3>
                            <Button
                                size="sm"
                                variant="light"
                                startContent={<RefreshCw size={16} />}
                                onPress={onRefresh}
                                isLoading={loading}
                            >
                                Refresh
                            </Button>
                        </div>
                        <Select
                            label="Choose an evoucher"
                            placeholder={loading ? "Loading evouchers..." : "Select an evoucher to send"}
                            selectedKeys={selectedEvoucher ? [selectedEvoucher._id] : []}
                            onSelectionChange={(keys) => {
                                const selectedKey = Array.from(keys)[0] as string;
                                onEvoucherSelect(selectedKey);
                            }}
                            className="w-full"
                            isLoading={loading}
                            isDisabled={loading}
                        >
                            {evouchers.map((evoucher) => (
                                <SelectItem 
                                    key={evoucher._id} 
                                    textValue={evoucher.acronym}
                                    isDisabled={isEvoucherExpired(evoucher)}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{evoucher.acronym}</span>
                                            <Badge 
                                                color={getEvoucherStatusColor(evoucher)}
                                                variant="flat"
                                                size="sm"
                                            >
                                                {getEvoucherStatusText(evoucher)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-default-500">
                                            <span className="flex items-center gap-1">
                                                <Percent size={12} />
                                                {evoucher.amount} THB
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                Expires: {new Date(evoucher.endAt).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Tag size={12} />
                                                Order: {evoucher.order}
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </Select>
                        {error && (
                            <div className="mt-2 p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                                <div className="flex items-center gap-2 text-danger-700 dark:text-danger-300">
                                    <AlertCircle size={16} />
                                    <span className="text-sm font-medium">
                                        Failed to load evouchers: {error}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedEvoucher && (
                        <>
                            <Divider />
                            <div className="bg-default-50 dark:bg-default-100/20 rounded-lg p-4">
                                <h4 className="font-semibold mb-3">Evoucher Details</h4>
                                
                                {!isEvoucherValid(selectedEvoucher) && (
                                    <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                                        <div className="flex items-center gap-2 text-warning-700 dark:text-warning-300">
                                            <AlertCircle size={16} />
                                            <span className="text-sm font-medium">
                                                {isEvoucherExpired(selectedEvoucher) && "This evoucher has expired"}
                                                {!isEvoucherExpired(selectedEvoucher) && selectedEvoucher.status !== 'ACTIVE' && "This evoucher is inactive"}
                                                {!isEvoucherExpired(selectedEvoucher) && selectedEvoucher.status === 'ACTIVE' && selectedEvoucher.claims && selectedEvoucher.claims.currentClaim >= selectedEvoucher.claims.maxClaim && "This evoucher has reached its maximum claim limit"}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Title</label>
                                        <Input
                                            value={evoucherData.title}
                                            onChange={(e) => onEvoucherDataChange({...evoucherData, title: e.target.value})}
                                            placeholder="Enter evoucher title"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600">Description</label>
                                        <Input
                                            value={evoucherData.description}
                                            onChange={(e) => onEvoucherDataChange({...evoucherData, description: e.target.value})}
                                            placeholder="Enter evoucher description"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-default-600">Claim URL</label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                value={evoucherData.claimURL}
                                                onChange={(e) => onEvoucherDataChange({...evoucherData, claimURL: e.target.value})}
                                                placeholder="Claim URL will be auto-generated"
                                                className="flex-1"
                                            />
                                            <Button
                                                isIconOnly
                                                variant="light"
                                                onPress={() => window.open(evoucherData.claimURL, '_blank')}
                                                isDisabled={!evoucherData.claimURL}
                                            >
                                                <ExternalLink size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </CardBody>
        </Card>
    );
} 