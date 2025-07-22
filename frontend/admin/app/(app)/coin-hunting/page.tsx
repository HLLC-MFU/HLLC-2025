'use client'
import { PageHeader } from "@/components/ui/page-header";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { ArrowLeft, BrickWallFire, Coins, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import LeaderBoardTable from "./_components/LeaderBoradTable";
import { useCoinHunting, useSponsorCoinHunting } from "@/hooks/useCoinHunting";
import { exportToCsv } from "./utils/exportToCsv";
import SponsorBoardTable from "./_components/SponsorTable";
import { useLandmark } from "@/hooks/useLandmark";
import { useEffect, useState } from "react";

export default function CoinHuntingPage() {
    const router = useRouter();
    const { coinHunting } = useCoinHunting();
    const { landmark } = useLandmark();
    const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
    const { sponsorCoinHunting } = useSponsorCoinHunting(selectedLandmarkId || undefined);

    const handleExport = () => {
        exportToCsv(coinHunting, "coin_hunting_leaderboard.csv");
    };

    const handleSponsorExport = () => {
        if (sponsorCoinHunting.length > 0 && selectedLandmarkId) {
            const selectedLandmark = landmark.find(l => l._id === selectedLandmarkId);
            const fileName = `sponsor_coin_hunting_${selectedLandmark?.name || "unknown"}_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.csv`;
            exportToCsv(sponsorCoinHunting, fileName);
        }
    };


    useEffect(() => {
        if (landmark.length > 0 && !selectedLandmarkId) {
            setSelectedLandmarkId(landmark[0]._id);
        }
    }, [landmark, selectedLandmarkId]);

    return (
        <>
            <PageHeader
                description="Coint Hunting"
                icon={<Coins />}
                title="Coin Hunting"
            />
            <div className="flex items-center gap-4 w-full mx-auto mb-4 justify-between">
                <Button
                    variant="flat"
                    size="lg"
                    startContent={<ArrowLeft className="w-4 h-4" />}
                    onPress={() => router.back()}
                    className="hover:bg-gray-100 transition-colors mb-2"
                >
                    Back
                </Button>
                <div className="flex gap-5">
                    <Button
                        variant="flat"
                        size="lg"
                        className="hover:bg-gray-100 transition-colors mb-2"
                        onPress={handleExport}>Export Leaderboard
                    </Button>
                    <Button
                        variant="flat"
                        size="lg"
                        className="hover:bg-gray-100 transition-colors"
                        onPress={handleSponsorExport}
                        isDisabled={!selectedLandmarkId || sponsorCoinHunting.length === 0}
                    >
                        Export Sponsor Leaderboard
                    </Button>
                </div>
            </div>
            <div>
                <Accordion variant="splitted" selectionMode="multiple">
                    <AccordionItem key="Learderboard" aria-label="Learderboard" title="Learderboard" startContent={<Trophy />}>
                        <LeaderBoardTable
                            leaderboards={coinHunting}
                        />
                    </AccordionItem>

                    <AccordionItem key="Learderboard By Sponsor" aria-label="Learderboard By Sponsor " title="Learderboard By Sponsor" startContent={<BrickWallFire />}>
                        <SponsorBoardTable
                            sponsorboards={sponsorCoinHunting}
                            landmark={landmark}
                            selectedLandmarkId={selectedLandmarkId}
                            onLandmarkChange={setSelectedLandmarkId}
                        />
                    </AccordionItem>
                </Accordion>
            </div>
        </>
    )
}