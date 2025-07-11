"use client";

import { useState, useEffect } from "react";
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Pagination, Modal, ModalContent, ModalHeader, ModalBody, Input, Select, SelectItem } from "@heroui/react";
import { Search, Filter, Calendar, User, Shield } from "lucide-react";
import { addToast } from "@heroui/toast";
import { useRestriction } from "@/hooks/useRestriction";
import { RestrictionHistoryItem } from "@/types/room";
import { RestrictionHistorySkeleton } from "./RestrictionHistorySkeleton";

type RestrictionHistoryProps = {
    roomId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function RestrictionHistory({ roomId, isOpen, onClose }: RestrictionHistoryProps) {
    const { getRestrictionHistory } = useRestriction();
    const [history, setHistory] = useState<RestrictionHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        type: "",
        status: "",
        search: ""
    });

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen, currentPage, filters]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: "20",
                roomId: roomId,
                ...(filters.type && { type: filters.type }),
                ...(filters.status && { status: filters.status })
            });

            const response = await getRestrictionHistory(params.toString());
            
            if (response?.data) {
                setHistory(response.data);
                setTotalPages(response.meta?.totalPages || 1);
            }
        } catch (error) {
            addToast({
                title: "Error loading history",
                description: error instanceof Error ? error.message : "Failed to load restriction history",
                color: "danger",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid Date";
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "Invalid Date";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'ban': return 'danger';
            case 'mute': return 'warning';
            case 'kick': return 'secondary';
            default: return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'success';
            case 'expired': return 'warning';
            case 'revoked': return 'danger';
            default: return 'default';
        }
    };

    const getUserDisplayName = (user: any) => {
        if (!user) return "Unknown User";
        
        if (user.name?.en) return user.name.en;
        if (user.name?.th) return user.name.th;
        
        return user.username || "Unknown User";
    };

    const getTypeDisplayName = (type: string) => {
        switch (type.toLowerCase()) {
            case 'ban': return 'BAN';
            case 'mute': return 'MUTE';
            case 'kick': return 'KICK';
            default: return type.toUpperCase();
        }
    };

    const getDurationDisplayName = (duration: string) => {
        switch (duration.toLowerCase()) {
            case 'temporary': return 'Temporary';
            case 'permanent': return 'Permanent';
            case 'instant': return 'Instant';
            default: return duration;
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
            <div className="rounded-xl overflow-hidden bg-white">
                <ModalContent>
                    <ModalHeader className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-default-900">Restriction History</h2>
                            <p className="text-sm text-default-500">Room ID: {roomId}</p>
                        </div>
                    </ModalHeader>
                    <ModalBody className="p-0">
                        {/* Filters */}
                        <div className="p-6 border-b border-default-200 bg-default-50 flex flex-wrap gap-4 rounded-t-xl">
                            <Input
                                isClearable
                                className="w-full sm:max-w-[300px]"
                                placeholder="Search by username..."
                                startContent={<Search />}
                                value={filters.search}
                                onClear={() => setFilters(prev => ({ ...prev, search: "" }))}
                                onValueChange={val => setFilters(prev => ({ ...prev, search: val }))}
                            />
                            <Select
                                className="flex-1"
                                selectedKeys={[filters.type || ""]}
                                onSelectionChange={keys => setFilters(prev => ({ ...prev, type: Array.from(keys)[0] as string }))}
                                aria-label="Type"
                                placeholder="All Types"
                            >
                                <SelectItem key="">All Types</SelectItem>
                                <SelectItem key="ban">Ban</SelectItem>
                                <SelectItem key="mute">Mute</SelectItem>
                                <SelectItem key="kick">Kick</SelectItem>
                            </Select>
                            <Select
                                className="flex-1"
                                selectedKeys={[filters.status || ""]}
                                onSelectionChange={keys => setFilters(prev => ({ ...prev, status: Array.from(keys)[0] as string }))}
                                aria-label="Status"
                                placeholder="All Status"
                            >
                                <SelectItem key="">All Status</SelectItem>
                                <SelectItem key="active">Active</SelectItem>
                                <SelectItem key="expired">Expired</SelectItem>
                                <SelectItem key="revoked">Revoked</SelectItem>
                            </Select>
                            <Button
                                color="primary"
                                variant="flat"
                                onPress={loadHistory}
                                startContent={<Filter size={16} />}
                            >
                                Apply Filters
                            </Button>
                        </div>
                        {/* Content */}
                        <div className="flex-1 overflow-hidden rounded-b-xl bg-white">
                            {loading ? (
                                <RestrictionHistorySkeleton />
                            ) : (
                                <div className="overflow-auto">
                                    <Table aria-label="Restriction history table">
                                        <TableHeader>
                                            <TableColumn>USER</TableColumn>
                                            <TableColumn>TYPE</TableColumn>
                                            <TableColumn>DURATION</TableColumn>
                                            <TableColumn>REASON</TableColumn>
                                            <TableColumn>STATUS</TableColumn>
                                            <TableColumn>MODERATOR</TableColumn>
                                            <TableColumn>DATE</TableColumn>
                                        </TableHeader>
                                        <TableBody
                                            emptyContent={
                                                <div className="text-center py-8 rounded-b-xl bg-white">
                                                    <Shield className="w-12 h-12 text-default-300 mx-auto mb-4" />
                                                    <p className="text-default-500">No restriction history found</p>
                                                </div>
                                            }
                                        >
                                            {history.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {getUserDisplayName(item.user)}
                                                                </p>
                                                                <p className="text-xs text-default-500">
                                                                    @{item.user?.username || 'unknown'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            color={getTypeColor(item.type)}
                                                            variant="flat"
                                                            size="sm"
                                                        >
                                                            {getTypeDisplayName(item.type)}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-default-600">
                                                            {getDurationDisplayName(item.duration)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-xs">
                                                            <p className="text-sm text-default-900 line-clamp-2">
                                                                {item.reason || "No reason provided"}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            color={getStatusColor(item.status)}
                                                            variant="flat"
                                                            size="sm"
                                                        >
                                                            {item.status.toUpperCase()}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center">
                                                                <Shield className="w-3 h-3 text-warning" />
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {getUserDisplayName(item.moderator)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-default-400" />
                                                            <span className="text-sm text-default-600">
                                                                {formatDate(item.created_at)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                        {/* Footer with Pagination */}
                        <div className="p-6 border-t border-default-200 bg-default-50 rounded-b-xl">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-default-500">
                                    Showing {history.length} of {totalPages * 20} records
                                </p>
                                <Pagination
                                    total={totalPages}
                                    page={currentPage}
                                    onChange={setCurrentPage}
                                    showControls
                                    color="primary"
                                    size="sm"
                                />
                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </div>
        </Modal>
    );
} 