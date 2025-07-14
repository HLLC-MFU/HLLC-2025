import React, { Key, useState } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Image, Chip } from "@heroui/react";
import { EllipsisVertical, ImageIcon, Pen, Trash, MapPin, Clock, Ruler, Hash, Globe } from "lucide-react";
import { Landmark, LandmarkType } from "@/types/landmark";

export type LandmarkColumnKey =
    | "name"
    | "hint"
    | "order"
    | "cooldown"
    | "limitDistance"
    | "location"
    | "mapCoordinate"
    | "type"
    | "hintImage"
    | "coinImage"
    | "actions";

type LandmarkCellRendererProps = {
    landmark: Landmark;
    columnKey: Key;
    onEdit: () => void;
    onDelete: () => void;
};

export default function LandmarkCellRenderer({
    landmark,
    columnKey,
    onEdit,
    onDelete
}: LandmarkCellRendererProps) {
    const [imgError, setImgError] = useState<{[key: string]: boolean}>({});
    const [imgLoading, setImgLoading] = useState<{[key: string]: boolean}>({});

    const handleImageError = (imageKey: string) => {
        setImgError(prev => ({ ...prev, [imageKey]: true }));
        setImgLoading(prev => ({ ...prev, [imageKey]: false }));
    };

    const handleImageLoad = (imageKey: string) => {
        setImgLoading(prev => ({ ...prev, [imageKey]: false }));
    };

    const handleImageLoadStart = (imageKey: string) => {
        setImgLoading(prev => ({ ...prev, [imageKey]: true }));
    };

    const formatDistance = (distance: number) => {
        if (distance >= 1000) {
            return `${(distance / 1000).toFixed(1)}km`;
        }
        return `${distance}m`;
    };

    const formatCooldown = (cooldown: number) => {
        if (cooldown >= 3600) {
            return `${Math.floor(cooldown / 3600)}h ${Math.floor((cooldown % 3600) / 60)}m`;
        } else if (cooldown >= 60) {
            return `${Math.floor(cooldown / 60)}m`;
        }
        return `${cooldown}s`;
    };

    switch (columnKey) {
        case "name":
            return (
                <div className="flex flex-col gap-1 max-w-[200px]">
                    <span className="text-sm font-semibold text-default-900 line-clamp-2 break-words">
                        {landmark.name.en}
                    </span>
                    <span className="text-xs text-default-600 line-clamp-1 break-words">
                        {landmark.name.th}
                    </span>
                </div>
            );

        case "hint":
            return (
                <div className="flex flex-col gap-1 max-w-[180px]">
                    <span className="text-xs text-default-700 line-clamp-3 break-words leading-relaxed">
                        {landmark.hint.en}
                    </span>
                    <span className="text-xs text-default-500 line-clamp-2 break-words leading-relaxed">
                        {landmark.hint.th}
                    </span>
                </div>
            );

        case "order":
            return (
                <div className="flex items-center gap-2">
                    <Hash size={14} className="text-default-400" />
                    <Chip size="sm" variant="flat" color="default">
                        {landmark.order}
                    </Chip>
                </div>
            );

        case "cooldown":
            return (
                <div className="flex items-center gap-2">
                    <Clock size={14} className="text-default-400" />
                    <span className="text-sm font-medium text-default-700">
                        {formatCooldown(landmark.cooldown)}
                    </span>
                </div>
            );

        case "limitDistance":
            return (
                <div className="flex items-center gap-2">
                    <Ruler size={14} className="text-default-400" />
                    <span className="text-sm font-medium text-default-700">
                        {formatDistance(landmark.limitDistance)}
                    </span>
                </div>
            );

        case "location":
            return (
                <div className="flex flex-col gap-2 max-w-[160px]">
                    <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-default-400 flex-shrink-0" />
                        <span className="text-xs text-default-700 font-mono">
                            {Number(landmark.location.latitude).toFixed(4)}, {Number(landmark.location.longitude).toFixed(4)}
                        </span>
                    </div>
                    {landmark.location.mapUrl && (
                        <a 
                            href={landmark.location.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary-600 transition-colors"
                        >
                            <Globe size={12} className="flex-shrink-0" />
                            <span className="break-all">Open Map</span>
                        </a>
                    )}
                </div>
            );

        case "mapCoordinate": {
            const coord = landmark.mapCoordinate || (landmark as any)?.mapCoordinates;
            return (
                <div className="flex flex-col gap-1 max-w-[120px]">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-default-500 w-4">X:</span>
                        <span className="text-sm text-default-700 font-mono">
                            {typeof coord?.x === 'number' ? coord.x.toFixed(1) : '-'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-default-500 w-4">Y:</span>
                        <span className="text-sm text-default-700 font-mono">
                            {typeof coord?.y === 'number' ? coord.y.toFixed(1) : '-'}
                        </span>
                    </div>
                </div>
            );
        }

        case "type":
            return (
                <Chip 
                    size="sm" 
                    variant="flat" 
                    className="capitalize"
                >
                    {landmark.type.replace('_', ' ')}
                </Chip>
            );

        case "hintImage":
            return (
                <div className="relative">
                    {landmark.hintImage && typeof landmark.hintImage === 'string' ? (
                        <div className="relative">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${landmark.hintImage}`}
                                alt={`${landmark.name.en} hint`}
                                className="rounded-lg border border-default-200 shadow-sm hover:shadow-md transition-shadow"
                                height={56}
                                width={56}
                                onError={() => handleImageError('hint')}
                                onLoad={() => handleImageLoad('hint')}
                                onLoadStart={() => handleImageLoadStart('hint')}
                            />
                            {imgLoading.hint && (
                                <div className="absolute inset-0 flex items-center justify-center bg-default-100 rounded-lg">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-14 w-14 border border-default-200 rounded-lg bg-default-50">
                            <ImageIcon className="text-default-400" size={20} />
                        </div>
                    )}
                </div>
            );

        case "coinImage":
            return (
                <div className="relative">
                    {landmark.coinImage && typeof landmark.coinImage === 'string' ? (
                        <div className="relative">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${landmark.coinImage}`}
                                alt={`${landmark.name.en} coin`}
                                className="rounded-lg border border-default-200 shadow-sm hover:shadow-md transition-shadow"
                                height={56}
                                width={56}
                                onError={() => handleImageError('coin')}
                                onLoad={() => handleImageLoad('coin')}
                                onLoadStart={() => handleImageLoadStart('coin')}
                            />
                            {imgLoading.coin && (
                                <div className="absolute inset-0 flex items-center justify-center bg-default-100 rounded-lg">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-14 w-14 border border-default-200 rounded-lg bg-default-50">
                            <ImageIcon className="text-default-400" size={20} />
                        </div>
                    )}
                </div>
            );

        case "actions":
            return (
                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <Button 
                            isIconOnly 
                            size="sm" 
                            variant="light"
                            className="hover:bg-default-100 transition-colors"
                        >
                            <EllipsisVertical className="text-default-400" size={16} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                        <DropdownItem
                            key="edit"
                            startContent={<Pen size={16} />}
                            onPress={onEdit}
                            className="hover:bg-default-100"
                        >
                            Edit Landmark
                        </DropdownItem>
                        <DropdownItem
                            key="delete"
                            className="text-danger hover:bg-danger-50"
                            color="danger"
                            startContent={<Trash size={16} />}
                            onPress={onDelete}
                        >
                            Delete Landmark
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            );

        default:
            return <span className="text-default-400">-</span>;
    }
}