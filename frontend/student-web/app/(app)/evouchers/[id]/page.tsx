'use client'

import useEvouchers from "@/hooks/useEvouchers";
import useSponsors from "@/hooks/useSponsors";
import { Input, Image, ScrollShadow } from "@heroui/react";
import { ArrowLeft, SearchIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import EvoucherModal from "./_components/EvoucherModal";
import { EvoucherCodes } from "@/types/evouchers";
import { ConfirmationModal } from "@/components/Modal/ConfirmationModal";
import EvoucherCodesSkeleton from "./_components/EvoucherCodesSkeleton";

export default function EvoucherDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const [searchText, setSearchText] = useState('')
    const [sponsorName, setSponsorName] = useState<string>("E-Vouchers");
    const [selectedCode, setSelectedCode] = useState<EvoucherCodes | null>(null)
    const [isVoucherOpen, setIsVoucherOpen] = useState<boolean>(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

    const { sponsors, loading: SponsorsLoading } = useSponsors();
    const { myEvoucherCodes, fetchMyEvoucherCodes, usedEvoucherCodes, loading: EvouchersLoading } = useEvouchers();

    const isLoading = SponsorsLoading || EvouchersLoading;

    const filteredEvoucherCode = myEvoucherCodes.filter(
        code => code.code.toLowerCase().includes(searchText.toLowerCase())
    )

    useEffect(() => {
        if (id && sponsors) {
            const name = sponsors.find((sponsor) => sponsor._id === id)?.name.th;
            if (name) setSponsorName(name)
        }
    }, [sponsors, id]);

    const confirmUseEvoucher = async () => {
        if (selectedCode) {
            const res = await usedEvoucherCodes(selectedCode?._id);
            if (res) await fetchMyEvoucherCodes();
        };
        setIsVoucherOpen(false);
        setIsConfirmOpen(false);
    }

    if (isLoading) return (
        <div className="flex flex-col gap-6 px-6">
            <div className="flex items-center gap-4 animate-pulse">
                <ArrowLeft size={28} color="white" onClick={router.back} />
                <div className="w-[200px] h-[30px] rounded-2xl shadow-xl bg-white/20"/>
            </div>
            <Input
                aria-label="Search"
                classNames={{
                    inputWrapper: 'bg-default-100',
                    input: 'text-sm',
                }}
                labelPlacement="outside"
                placeholder="Search for E-Voucher..."
                startContent={
                    <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
                }
                type="search"
                onValueChange={setSearchText}
                value={searchText}
                radius="full"
                size="lg"
                variant="faded"
            />
            <EvoucherCodesSkeleton />
        </div>
    )

    return (
        <div className="flex flex-col h-full gap-6 px-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <ArrowLeft size={28} color="white" onClick={router.back} />
                <p className="text-2xl text-white font-bold">{sponsorName}</p>
            </div>

            {/* Search Bar */}
            <Input
                aria-label="Search"
                classNames={{
                    inputWrapper: 'bg-default-100',
                    input: 'text-sm',
                }}
                labelPlacement="outside"
                placeholder="Search for E-Voucher..."
                startContent={
                    <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
                }
                type="search"
                onValueChange={setSearchText}
                value={searchText}
                radius="full"
                size="lg"
                variant="faded"
            />

            {/* User Evoucher */}
            <ScrollShadow className="h-[90%] overflow-y-auto pb-10" size={40} hideScrollBar>
                <div className="grid justify-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center gap-8">
                    {filteredEvoucherCode.map((code, index) => {
                        const evoucherCode = code.evoucher?.sponsor === id ? code : null;
                        if (evoucherCode?.evoucher?.photo?.home) {
                            return (
                                <Image
                                    key={index}
                                    alt={evoucherCode.code}
                                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucherCode.evoucher.photo.home}`}
                                    width={320}
                                    className={`-my-10 active:brightness-50 ${code.isUsed ? "brightness-50" : ""}`}
                                    onClick={() => {
                                        setIsVoucherOpen(true);
                                        setSelectedCode(evoucherCode);
                                    }}
                                />
                            )
                        } else if (evoucherCode) {
                            return (
                                <div
                                    key={index}
                                    className="flex justify-center items-center w-[320px] h-[110px] rounded-2xl shadow-xl bg-white/40 backdrop-blur-md border border-white active:brightness-50"
                                    onClick={() => {
                                        setIsVoucherOpen(true);
                                        setSelectedCode(evoucherCode);
                                    }}
                                >
                                    <p className="font-semibold">{evoucherCode?.code ?? ""}</p>
                                </div>
                            )
                        }
                    })}
                </div>
            </ScrollShadow>

            {/* Evoucher Code Modal */}
            <EvoucherModal
                isOpen={isVoucherOpen}
                onClose={() => setIsVoucherOpen(false)}
                code={selectedCode}
                setIsConfirmOpen={() => setIsConfirmOpen(true)}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmUseEvoucher}
                title='Confirm E-Voucher Usage'
                body='Are you sure you want to use this E-Voucher'
            />
        </div>
    )
} 