import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { apiRequest } from '@/utils/api';
import useProfile from '@/hooks/useProfile';
import DynamicLeaderboard, { LeaderboardUser } from '@/components/step-counter/DynamicLeaderboard';
import styles from '@/components/step-counter/styles';

interface Name {
  first: string;
  middle?: string;
  last?: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  name: Name;
  coinCount: number;
  latestCollectedAt: string;
  rank: number;
}

export default function CoinHuntingLeaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useProfile();
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<{ data: LeaderboardEntry[] }>('/coin-collections/leaderboard');
        if (res.statusCode === 200 && res.data) {
          setData(res.data.data || []);
        } else {
          setError(res.message || 'Failed to fetch leaderboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getFullName = (name: Name) => {
    if (!name) return 'Unknown';
    return [name.first, name.middle, name.last].filter(Boolean).join(' ');
  };

  // Prepare users for DynamicLeaderboard
  const users: LeaderboardUser[] = data.map((entry) => ({
    user: { _id: entry.userId, name: entry.name },
    totalStep: entry.coinCount, // use coinCount as step count for display
  }));

  // Prepare usersData for LeaderboardList
  const usersData = data.map((entry) => ({
    name: entry.name || { first: 'Unknown' },
    stepCount: entry.coinCount,
    rank: entry.rank,
    isTeam: false,
  }));

  // Find current user in leaderboard
  const currentUserId = user?.data?.[0]?._id;
  const currentUserIdx = data.findIndex(
    (entry) => currentUserId && entry.userId === currentUserId
  );
  const currentUserData = currentUserIdx !== -1
    ? {
        name: data[currentUserIdx].name || { first: 'Unknown' },
        stepCount: data[currentUserIdx].coinCount,
        rank: data[currentUserIdx].rank,
        isLoading: false,
      }
    : {
        name: user?.data?.[0]?.name || { first: 'Me' },
        stepCount: 0,
        rank: 0,
        isLoading: false,
      };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#18181b' }}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={{ color: '#fff', marginTop: 12, fontSize: 16 }}>Loading leaderboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#18181b' }}>
        <Text style={{ color: '#ff4d4f', fontSize: 16, textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.leaderboardTitle}>COIN HUNTING</Text>
          <Text style={styles.leaderboardSubtitle}>LEADER BOARD</Text>
        </View>
      </View>
      <DynamicLeaderboard
        users={users}
        usersData={usersData}
        currentUserData={currentUserData}
        getFullName={getFullName}
        width={width}
        height={height}
        cardNameStyle={styles.cardMyName}
        valueLabel="coins"
      />
    </SafeAreaView>
  );
} 