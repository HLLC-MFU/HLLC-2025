'use client';

import { Input, Image, ScrollShadow } from '@heroui/react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import useSponsors from '@/hooks/useSponsors';
import EvouchersSkeleton from "./_components/EvouchersSkeleton";

export default function EvoucherPage() {
    const router = useRouter();
    const [searchText, setSearchText] = useState('');
    const { sponsors, loading } = useSponsors();

    const filteredSponsors = sponsors.filter(
        sponsor =>
            sponsor.name.en.toLowerCase().includes(searchText.toLowerCase()) ||
            sponsor.name.th.toLowerCase().includes(searchText.toLowerCase()),
    );

    const handleSponsorCardClick = (sponsorId: string) => {
        router.push(`/evouchers/${sponsorId}`);
    };

    if (!loading && filteredSponsors.length === 0) {
        <div className="flex flex-col gap-6">
            <p className="text-center text-sm text-white/80">
                No sponsors found.
            </p>
        </div>
    }

    return (
        <div className="flex flex-col h-full gap-6">
            <p className="text-3xl text-white font-bold">E-Voucher</p>
            {/* Search Bar */}
            <Input
                aria-label="Search sponsors"
                placeholder="Search sponsors..."
                classNames={{
                    input: "text-white placeholder:text-white/60",
                    inputWrapper: "border-2 border-white/40",
                    clearButton: "text-white"
                }}
                size="lg"
                startContent={<Search className="text-white/60" size={20} />}
                onValueChange={setSearchText}
                value={searchText}
                type="search"
                variant="bordered"
            />

            {/* Sponsors Group */}
            <ScrollShadow className="h-[90%] overflow-y-auto pb-10" size={40} hideScrollBar>
                {loading ? (
                    <EvouchersSkeleton />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {filteredSponsors.map((sponsor, index) => {
                            if (sponsor?.logo?.logoPhoto) {
                                return (
                                    <Image
                                        key={index}
                                        alt={sponsor.name?.en ?? ""}
                                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.logo.logoPhoto}`}
                                        className="aspect-square object-contain bg-white/40 border-2 border-[#b1b1b1ff] rounded-3xl active:brightness-50"
                                        onClick={() => handleSponsorCardClick(sponsor._id)}
                                    />
                                )
                            } else {
                                return (
                                    <div
                                        key={index}
                                        className="flex justify-center items-center aspect-square bg-white/20 rounded-3xl shadow-xl backdrop-blur-md border border-white active:brightness-50"
                                        onClick={() => handleSponsorCardClick(sponsor._id)}
                                    >
                                        <p className="font-semibold">{sponsor?.name?.en ?? ""}</p>
                                    </div>
                                )
                            }
                        })}
                    </div>
                )}
            </ScrollShadow>
        </div>
    )
};