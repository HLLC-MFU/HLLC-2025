import { Leaderboard, Sponsorboard } from "@/types/coin-hunting";
import { Key } from "react";

export type SposorBoardColumnKey =
    | "rank"
    | "username"
    | "name"
    | "coinCount"
    | "latestCollectedAt"

type SponsorBoardCellRendererProps = {
    sponsorboard: Sponsorboard;
    columnKey: Key;
};

export default function SponsorBoardCellRenderer({
    sponsorboard,
    columnKey,
}: SponsorBoardCellRendererProps) {

    switch (columnKey) {
        case "rank":
            return (
                <span className="text-sm">
                    {sponsorboard?.rank ?? "-"}
                </span>);

        case "username":
            return (
                <span className="text-sm text-default-900">
                    {sponsorboard?.username ?? "-"}
                </span>
            );

        case "name":
            return (
                <span className="text-sm text-default-900">
                    {[sponsorboard?.name.first, sponsorboard?.name.middle, sponsorboard?.name.last]
                        .filter(Boolean)
                        .join(" ") || "-"}
                </span>
            );

        case "coinCount":
            return (
                <div className="flex flex-col text-sm text-default-900">
                    {sponsorboard.coinCount ?? "-"}
                </div>
            );

        case "latestCollectedAt":
            return (
                <div className="flex flex-col text-sm text-default-900">
                    {sponsorboard.latestCollectedAt
                        ? new Date(sponsorboard.latestCollectedAt).toLocaleString("th-TH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })
                        : "-"}
                </div>
            );

        default:
            return <span>-</span>;
    }
}
