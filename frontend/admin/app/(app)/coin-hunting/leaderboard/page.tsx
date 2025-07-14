'use client';

import { useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Trophy } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import LeaderboardTable from './_components/LeaderboardTable';

export default function LeaderboardPage() {
  const { leaderboard, loading, fetchLeaderboard } = useLeaderboard();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <>
      <PageHeader
        description="Top 5 Coin Hunting Leaderboard"
        icon={<Trophy />}
        title="Leaderboard"
      />
      <div className="flex flex-col gap-6">
        <LeaderboardTable leaderboard={leaderboard} />
      </div>
    </>
  );
}
