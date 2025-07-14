import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Trophy, User as UserIcon } from "lucide-react";
import { Leaderboard } from "@/types/leaderboard";

const rankColors = [
  "bg-yellow-100 text-yellow-700",
  "bg-gray-200 text-gray-500",
  "bg-amber-100 text-amber-700",
  "",
  "",
];

function getInitials(name: { first: string; middle?: string; last?: string }) {
  return [name.first, name.middle, name.last].filter(Boolean).map(n => n && n.length > 0 ? n[0].toUpperCase() : "").join("");
}

export default function LeaderboardTable({ leaderboard }: { leaderboard: Leaderboard[] }) {
  const leaderboardWithRank = leaderboard.map((entry, idx) => ({ ...entry, _rank: idx }));
  return (
    <div className="rounded-xl border border-default-200 bg-white shadow-sm overflow-hidden">
      <Table aria-label="Leaderboard Table" className="min-w-full">
        <TableHeader>
          <TableColumn>RANK</TableColumn>
          <TableColumn>PLAYER</TableColumn>
          <TableColumn>COINS</TableColumn>
          <TableColumn>LAST COLLECTED</TableColumn>
        </TableHeader>
        <TableBody
          emptyContent={<div className="flex flex-col items-center justify-center py-8"><span className="text-default-400">No leaderboard data</span></div>}
          items={leaderboardWithRank}
        >
          {(entry: Leaderboard & { _rank: number }) => (
            <TableRow
              key={entry.userId}
              style={entry._rank === 0 ? { background: undefined } : undefined}
            >
              <TableCell>
                <span className="font-bold text-lg flex items-center gap-1">
                  {entry._rank === 0 ? <Trophy className="inline-block text-yellow-500" /> : entry._rank + 1}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-default-200 flex items-center justify-center text-lg font-bold text-primary">
                    {getInitials(entry.name) || <UserIcon size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{[entry.name.first, entry.name.middle, entry.name.last].filter(Boolean).join(" ")}</span>
                    <span className="text-xs text-default-500">{entry.username}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold text-primary">{entry.coinCount}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-default-500">{new Date(entry.latestCollectedAt).toLocaleDateString()}</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}