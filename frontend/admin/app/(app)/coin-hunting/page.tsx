'use client'
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@heroui/react";
import { ArrowLeft, Coins } from "lucide-react";
import { useRouter } from "next/navigation";
import LeaderBoardTable from "./_components/LeaderBoradTable";
import { useCoinHunting } from "@/hooks/useCoinHunting";
import { exportToCsv } from "./utils/exportToCsv";

export default function CoinHuntingPage() {
    const router = useRouter();
    const { coinHunting } = useCoinHunting();
    const handleExport = () => {
        exportToCsv(coinHunting, "coin_hunting_leaderboard.csv");
    };
    return (
        <>
            <PageHeader
                description="Manage evouchers"
                icon={<Coins />}
                title="CoinHunting"
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
                <Button
                    variant="flat"
                    size="lg"
                    className="hover:bg-gray-100 transition-colors mb-2"
                    onPress={handleExport}>Export CSV</Button>
            </div>
            <div>
                <LeaderBoardTable
                    leaderboads={coinHunting}
                />
            </div>
        </>
    )
}