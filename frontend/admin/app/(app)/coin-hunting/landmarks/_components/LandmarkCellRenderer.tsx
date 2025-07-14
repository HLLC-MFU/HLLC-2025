import React, { Key, useState } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Image } from "@heroui/react";
import { EllipsisVertical, ImageIcon, Pen, Trash } from "lucide-react";
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
    const [imgError, setImgError] = useState(false);

    switch (columnKey) {
        case "name":
            return (
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-default-900 font-medium">EN: {landmark.name.en}</span>
                    <span className="text-sm text-default-900 font-medium">TH: {landmark.name.th}</span>
                </div>
            );
        case "hint":
            return (
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-default-700">EN: {landmark.hint.en}</span>
                    <span className="text-xs text-default-700">TH: {landmark.hint.th}</span>
                </div>
            );
        case "order":
            return landmark.order;
        case "cooldown":
            return landmark.cooldown;
        case "limitDistance":
            return landmark.limitDistance;
        case "location":
            return (
                <div className="flex flex-col text-xs">
                    <span>Lat: {landmark.location.latitude}</span>
                    <span>Long: {landmark.location.longitude}</span>
                    <span className="truncate max-w-[120px]">URL: {landmark.location.mapUrl}</span>
                </div>
            );
        case "mapCoordinate": {
            const coord = landmark.mapCoordinate || (landmark as any)?.mapCoordinates;
            return (
                <div className="flex flex-col text-xs">
                    <span>X: {typeof coord?.x === 'number' ? coord.x : '-'}</span>
                    <span>Y: {typeof coord?.y === 'number' ? coord.y : '-'}</span>
                </div>
            );
        }
        case "type":
            return <span className="capitalize">{landmark.type}</span>;
        case "hintImage":
            return landmark.hintImage && typeof landmark.hintImage === 'string' ? (
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${landmark.hintImage}`}
                    alt={landmark.name.en}
                    className="rounded border border-default-300"
                    height={48}
                    width={48}
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="flex justify-center items-center h-12 w-12 border border-default-300 rounded">
                    <ImageIcon className="text-gray-500" />
                </div>
            );
        case "coinImage":
            return landmark.coinImage && typeof landmark.coinImage === 'string' ? (
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${landmark.coinImage}`}
                    alt={landmark.name.en}
                    className="rounded border border-default-300"
                    height={48}
                    width={48}
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="flex justify-center items-center h-12 w-12 border border-default-300 rounded">
                    <ImageIcon className="text-gray-500" />
                </div>
            );
        case "actions":
            return (
                <Dropdown>
                    <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                            <EllipsisVertical className="text-default-400" />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                        <DropdownItem
                            key="edit"
                            startContent={<Pen size={16} />}
                            onPress={onEdit}
                        >
                            Edit
                        </DropdownItem>
                        <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash size={16} />}
                            onPress={onDelete}
                        >
                            Delete
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            );
        default:
            return <span>-</span>;
    }
} 