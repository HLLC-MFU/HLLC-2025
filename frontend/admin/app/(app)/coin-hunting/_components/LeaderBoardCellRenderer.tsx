import { Leaderboard } from "@/types/coin-hunting";
import { Key } from "react";

export type EvoucherColumnKey =
    | "rank"
    | "username"
    | "name"
    | "coinCount"
    | "latestCollectedAt"

type LeaderBoardCellRendererProps = {
    leaderboad: Leaderboard;
    columnKey: Key;
};

export default function LeaderBoardCellRenderer({
    leaderboad,
    columnKey,
}: LeaderBoardCellRendererProps) {

    switch (columnKey) {
        case "rank":
            return (
                <span className="text-sm">
                    {leaderboad?.rank ?? "-"}
                </span>);

        case "username":
            return (
                <span className="text-sm text-default-900">
                    {leaderboad?.username ?? "-"}
                </span>
            );

        case "name":
            return (
                <span className="text-sm text-default-900">
                    {[leaderboad?.name.first, leaderboad?.name.middle, leaderboad?.name.last]
                        .filter(Boolean)
                        .join(" ") || "-"}
                </span>
            );

        case "coinCount":
            return (
                <div className="flex flex-col text-sm text-default-900">
                    {leaderboad.coinCount ?? "-"}
                </div>
            );

        case "latestCollectedAt":
            return (
                <div className="flex flex-col text-sm text-default-900">
                    {leaderboad.latestCollectedAt
                        ? new Date(leaderboad.latestCollectedAt).toLocaleString("th-TH", {
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
