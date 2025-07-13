"use client";

import { Card, CardBody, Button, Input, Select, SelectItem, Divider, Badge } from "@heroui/react";
import { Calendar, Percent, Tag, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";

import { Evoucher } from "@/types/evoucher";

type EvoucherSelectionProps = {
    evouchers: Evoucher[];
    selectedEvoucher: Evoucher | null;
    evoucherData: {
        message: {
            th: string;
            en: string;
        };
        claimUrl: string;
        sponsorImage: string;
    };
    loading: boolean;
    error: string | null;
    onEvoucherSelect: (evoucherId: string) => void;
    onRefresh: () => void;
};

export function EvoucherSelection({
    evouchers,
    selectedEvoucher,
    evoucherData,
    loading,
    error,
    onEvoucherSelect,
    onRefresh,
}: EvoucherSelectionProps) {
    const isEvoucherExpired = (evoucher: Evoucher): boolean => {
        const endDate = evoucher.endAt;
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    const getEvoucherStatus = (evoucher: Evoucher) => {
        if (isEvoucherExpired(evoucher)) {
            return { color: "danger" as const, text: "Expired" };
        }
        
        const now = new Date();
        const startAt = evoucher.startAt ? new Date(evoucher.startAt) : null;
        const endAt = evoucher.endAt ? new Date(evoucher.endAt) : null;
        
        if (startAt && endAt && now >= startAt && now <= endAt) {
            return { color: "success" as const, text: "Active" };
        }
        
        if (startAt && now < startAt) {
            return { color: "warning" as const, text: "Not Started" };
        }
        
        return { color: "warning" as const, text: "Inactive" };
    };

    const isEvoucherValid = (evoucher: Evoucher | null): boolean => {
        if (!evoucher) return false;
        if (isEvoucherExpired(evoucher)) return false;
        
        const now = new Date();
        const startAt = evoucher.startAt ? new Date(evoucher.startAt) : null;
        const endAt = evoucher.endAt ? new Date(evoucher.endAt) : null;
        
        if (startAt && endAt && (now < startAt || now > endAt)) return false;
        return true;
    };

    const formatDate = (dateString: string | Date) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Card>
            <CardBody>
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Select Evoucher</h3>
                            <Button
                                isLoading={loading}
                                size="sm"
                                endContent={<RefreshCw size={16} />}
                                variant="light"
                                onPress={onRefresh}
                            >
                                Refresh
                            </Button>
                        </div>
                        
                        <Select
                            className="w-full"
                            isDisabled={loading}
                            isLoading={loading}
                            label="Choose an evoucher"
                            placeholder={loading ? "Loading evouchers..." : "Select an evoucher to send"}
                            selectedKeys={selectedEvoucher ? [selectedEvoucher._id || ""] : []}
                            onSelectionChange={(keys) => {
                                const selectedKey = Array.from(keys)[0] as string;
                                onEvoucherSelect(selectedKey);
                            }}
                        >
                            {evouchers.map((evoucher) => {
                                const status = getEvoucherStatus(evoucher);
                                return (
                                    <SelectItem 
                                        key={evoucher._id} 
                                        isDisabled={isEvoucherExpired(evoucher)}
                                        textValue={evoucher.acronym}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{evoucher.acronym}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-default-500">
                                                <span className="flex items-center gap-1">
                                                    <Percent size={12} />
                                                    {evoucher.amount} THB
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    Expires: {formatDate(evoucher.endAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Tag size={12} />
                                                    Order: {evoucher.order}
                                                </span>
                                            </div>
                                        </div>
                                    </SelectItem>
                                );
                            })}
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
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold">Evoucher Details</h4>
                                    <div className="text-xs text-default-500 bg-default-100 px-2 py-1 rounded">
                                        Read-only preview
                                    </div>
                                </div>
                                
                                {!isEvoucherValid(selectedEvoucher) && (
                                    <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                                        <div className="flex items-center gap-2 text-warning-700 dark:text-warning-300">
                                            <AlertCircle size={16} />
                                            <span className="text-sm font-medium">
                                                {isEvoucherExpired(selectedEvoucher) 
                                                    ? "This evoucher has expired"
                                                    : "This evoucher is inactive"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-default-600 mb-2 block">
                                                Message (Thai)
                                                <span className="text-xs text-default-400 ml-2">• Auto-generated</span>
                                            </label>
                                            <Input
                                                className="mt-1"
                                                placeholder="Message in Thai"
                                                value={evoucherData.message.th}
                                                isReadOnly
                                                isDisabled
                                                variant="bordered"
                                                classNames={{
                                                    input: "bg-default-50",
                                                    inputWrapper: "border-default-200"
                                                }}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="text-sm font-medium text-default-600 mb-2 block">
                                                Message (English)
                                                <span className="text-xs text-default-400 ml-2">• Auto-generated</span>
                                            </label>
                                            <Input
                                                className="mt-1"
                                                placeholder="Message in English"
                                                value={evoucherData.message.en}
                                                isReadOnly
                                                isDisabled
                                                variant="bordered"
                                                classNames={{
                                                    input: "bg-default-50",
                                                    inputWrapper: "border-default-200"
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-default-600 mb-2 block">
                                                Sponsor Image
                                                <span className="text-xs text-default-400 ml-2">• From sponsor data</span>
                                            </label>
                                            <div className="mt-1 flex items-center gap-3 p-3 bg-default-50 rounded-lg border border-default-200">
                                                {evoucherData.sponsorImage ? (
                                                    <>
                                                        <div className="w-12 h-12 bg-default-100 rounded flex items-center justify-center overflow-hidden">
                                                            <img 
                                                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucherData.sponsorImage}`}
                                                                alt="Sponsor" 
                                                                className="w-full h-full object-cover rounded"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                                    if (fallback) fallback.classList.remove('hidden');
                                                                }}
                                                            />
                                                            <span className="text-xs text-default-500 hidden">IMG</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm text-default-700 font-medium">Sponsor Logo</span>
                                                            <span className="text-xs text-default-400 break-all">{evoucherData.sponsorImage}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-default-100 rounded flex items-center justify-center">
                                                            <span className="text-xs text-default-500">IMG</span>
                                                        </div>
                                                        <span className="text-sm text-default-400">No sponsor image available</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-default-600 mb-2 block">
                                            Claim URL
                                            <span className="text-xs text-default-400 ml-2">• From Evoucher</span>
                                        </label>
                                        <div className="flex gap-2 mt-1">
                                            <Input
                                                className="flex-1"
                                                placeholder="Claim URL will be auto-generated"
                                                value={evoucherData.claimUrl}
                                                isReadOnly
                                                isDisabled
                                                variant="bordered"
                                                classNames={{
                                                    input: "bg-default-50 text-xs",
                                                    inputWrapper: "border-default-200"
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 p-3 bg-default-50 rounded-lg border border-default-200">
                                            <p className="text-xs text-default-500 mb-2">
                                                <strong>Note:</strong> This URL will be used by students to claim the evoucher.
                                            </p>
                                            <p className="text-xs text-default-400">
                                                • The URL is automatically generated based on the selected evoucher<br/>
                                                • Students can click this URL to claim their evoucher code<br/>
                                                • Each student can only claim once per evoucher
                                            </p>
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