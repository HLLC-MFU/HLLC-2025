export type Leaderboard = {
  userId: string;
  username: string;
  name: {
    first: string;
    middle?: string;
    last?: string;
  };
  coinCount: number;
  latestCollectedAt: string;
  rank: number;
};