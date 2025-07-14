'use client'

import useSponsors from "@/hooks/useSponsors";
import { Input, Image, ScrollShadow } from "@heroui/react";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EvoucherPage() {
    const router = useRouter();
    const [searchText, setSearchText] = useState('')
    const { sponsors, loading } = useSponsors();

    const filteredSponsors = sponsors.filter(
        sponsor =>
            sponsor.name.en.toLowerCase().includes(searchText.toLowerCase()) ||
            sponsor.name.th.toLowerCase().includes(searchText.toLowerCase())
    )

    const handleSponsorCardClick = (sponsorId: string) => {
        router.push(`/evouchers/${sponsorId}`)
    }

    return (
        <div className="flex flex-col gap-6 pt-36 px-6">
            {/* Header */}
            <p className="text-2xl font-bold">E-Voucher</p>

            {/* Search Bar */}
            <Input
                aria-label="Search"
                classNames={{
                    inputWrapper: 'bg-default-100',
                    input: 'text-sm',
                }}
                labelPlacement="outside"
                placeholder="Search for Sponsor..."
                startContent={
                    <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
                }
                type="search"
                onValueChange={setSearchText}
                value={searchText}
            />

            {/* Sponsors Group */}
            <ScrollShadow className="h-[550px] overflow-y-auto pb-10" size={40} hideScrollBar>
                <div className="grid grid-cols-2 gap-6">
                    {filteredSponsors.map((sponsor, index) => {
                        const logoSrc = sponsor?.logo?.logoPhoto
                            ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.logo.logoPhoto}`
                            : ''; //← Fix this make it better @wrtn

                        return (
                            <Image
                                key={index}
                                alt={sponsor.name.en}
                                src={logoSrc}
                                className="border-2 border-[#b1b1b1ff] rounded-3xl"
                                onClick={() => handleSponsorCardClick(sponsor._id)}
                            />
                        )
                    })}
                </div>
            </ScrollShadow>
        </div>
    )
};