import { Leaderboard } from "@/types/coin-hunting";
import { Key } from "react";

export type LeaderBoradColumnKey =
    | "rank"
    | "username"
    | "name"
    | "coinCount"
    | "latestCollectedAt"

type LeaderBoardCellRendererProps = {
    leaderboard: Leaderboard;
    columnKey: Key;
};

export default function LeaderBoardCellRenderer({
    leaderboard,
    columnKey,
}: LeaderBoardCellRendererProps) {

    switch (columnKey) {
        case "rank":
            return (
                <span className="text-sm">
                    {leaderboard?.rank ?? "-"}
                </span>);

        case "username":
            return (
                <span className="text-sm text-default-900">
                    {leaderboard?.username ?? "-"}
                </span>
            );

        case "name":
            return (
                <span className="text-sm text-default-900">
                    {[leaderboard?.name.first, leaderboard?.name.middle, leaderboard?.name.last]
                        .filter(Boolean)
                        .join(" ") || "-"}
                </span>
            );

        case "coinCount":
            return (
                <div className="flex flex-col text-sm text-default-900">
                    {leaderboard.coinCount ?? "-"}
                </div>
            );

        case "latestCollectedAt":
            return (
                <div className="flex flex-col text-sm text-default-900">
                    {leaderboard.latestCollectedAt
                        ? new Date(leaderboard.latestCollectedAt).toLocaleString("th-TH", {
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
