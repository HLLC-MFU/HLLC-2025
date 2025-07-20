import React, { Key, useState } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Image } from "@heroui/react";
import { EllipsisVertical, ImageIcon, Pen, Trash } from "lucide-react";
import { Evoucher } from "@/types/evoucher";
import { Sponsors } from "@/types/sponsors";
import { Lang } from "@/types/lang";

export type EvoucherColumnKey =
    | "sponsors"
    | "name"
    | "acronym"
    | "order"
    | "startAt"
    | "endAt"
    | "detail"
    | "photo"
    | "amount"
    | "actions";

type EvoucherCellRendererProps = {
    evoucher: Evoucher;
    columnKey: Key;
    onEdit: () => void;
    onDelete: () => void;
};

export default function EvoucherCellRenderer({
    evoucher,
    columnKey,
    onEdit,
    onDelete
}: EvoucherCellRendererProps) {
    const [imgError, setImgError] = useState(false);
    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    } as const;
    const timeOptions = {
        hour: "2-digit",
        minute: "2-digit"
    } as const;

    switch (columnKey) {
        case "sponsors":
            return (
                <div className="flex flex-col gap-4">
                    {(['en', 'th'] as (keyof Lang)[]).map((lang) => (
                        <div className="flex text-sm text-default-900 gap-1">
                            <span className="font-medium text-default-400">
                                {lang.toUpperCase()} :
                            </span>
                            <span>{(evoucher.sponsor as Sponsors)?.name?.[lang] ?? '-'}</span>
                        </div>
                    ))}
                </div>
            );
        case "name":
            return (
                <div className="flex flex-col gap-4">
                    {(['en', 'th'] as (keyof Lang)[]).map((lang) => (
                        <div className="flex text-sm text-default-900 gap-1">
                            <span className="font-medium text-default-400">
                                {lang.toUpperCase()} :
                            </span>
                            <span>{evoucher.name?.[lang]}</span>
                        </div>
                    ))}
                </div>
            );
        case "acronym":
            return evoucher.acronym;
        case "order":
            return evoucher.order;
        case "startAt":
            return (
                <>
                    <p>{new Date(evoucher.startAt).toLocaleDateString('en-US', dateOptions)}</p>
                    <p>{new Date(evoucher.startAt).toLocaleTimeString('en-US', timeOptions)}</p>
                </>
            )
        case "endAt":
            return (
                <>
                    <p>{new Date(evoucher.endAt).toLocaleDateString('en-US', dateOptions)}</p>
                    <p>{new Date(evoucher.endAt).toLocaleTimeString('en-US', timeOptions)}</p>
                </>
            );
        case "detail":
            return (
                <div className="flex flex-col gap-4">
                    {(['en', 'th'] as (keyof Lang)[]).map((lang) => (
                        <div className="flex text-sm text-default-900 gap-1">
                            <span className="font-medium text-default-400">
                                {lang.toUpperCase()} :
                            </span>
                            <span>{evoucher.detail?.[lang]}</span>
                        </div>
                    ))}
                </div>
            );
        case "photo":
            return (
                !evoucher.photo.home || imgError ? (
                    <div className="flex justify-center items-center h-20 w-20 border border-default-300 rounded">
                        <ImageIcon className="text-gray-500" />
                    </div>
                ) : (
                    <>
                        <div className='flex gap-1'>
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucher.photo.front}`}
                                alt={evoucher.name.en}
                                className="rounded border border-default-300"
                                height={64}
                                width={64}
                                onError={() => setImgError(true)}
                            />
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucher.photo.back}`}
                                alt={evoucher.name.en}
                                className="rounded border border-default-300"
                                height={64}
                                width={64}
                                onError={() => setImgError(true)}
                            />
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucher.photo.home}`}
                                alt={evoucher.name.en}
                                className="rounded border border-default-300"
                                height={64}
                                width={64}
                                onError={() => setImgError(true)}
                            />
                        </div>
                    </>
                )
            );
        case "amount":
            return evoucher.amount;
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