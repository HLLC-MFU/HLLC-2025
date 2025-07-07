import  { useState, useRef, useEffect } from 'react';
import { View, Text, Alert, Dimensions, Animated, SafeAreaView } from 'react-native';
import styles from './styles';
import useProfile from '../../hooks/useProfile';
import useStepLeaderboard from '../../hooks/useStepLeaderboard';
import SegmentedToggle from '@/components/step-counter/SegmentedToggle';
import DynamicLeaderboard, { LeaderboardUser } from './DynamicLeaderboard';
import useStepAchievement from '../../hooks/useStepAchievement';


export default function LeaderBoard() {
  const [selectedTab, setSelectedTab] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { user } = useProfile();
  const schoolId = user?.data?.[0]?.metadata?.major?.school?._id;

  const {
    allLeaderboard: individualUsers,
    allLoading: individualLoading,
    allError: individualError,
    achievedLeaderboard: achievementUsers,
    achievedLoading: achievementLoading,
    achievedError: achievementError,
    individualUserRank,
    schoolUserRank,
    achievementUserRank,
    userRankLoading,
    userRankError,
    setLastAchievementId,
  } = useStepLeaderboard();

  const { achievements, loading: achievementIdLoading } = useStepAchievement();
  const currentAchievementId = achievements[0]?._id;
  useEffect(() => {
    if (currentAchievementId) setLastAchievementId(currentAchievementId);
  }, [currentAchievementId, setLastAchievementId]);

  // ใช้ allLeaderboard สำหรับ groupUsers ด้วย (ถ้าไม่มี group leaderboard แยก)
  const groupUsers: LeaderboardUser[] = individualUsers;
  const groupLoading = individualLoading;
  const groupError = individualError;

  const users: LeaderboardUser[] = selectedTab === 0
    ? individualUsers
    : selectedTab === 1
      ? groupUsers
      : selectedTab === 2
        ? achievementUsers
        : [];

  const loading = selectedTab === 0 ? individualLoading : selectedTab === 1 ? groupLoading : selectedTab === 2 ? achievementLoading : false;
  const error = selectedTab === 0 ? individualError : selectedTab === 1 ? groupError : selectedTab === 2 ? achievementError : null;

  const { width, height } = Dimensions.get('window');

  const handleTabChange = (tabIdx: React.SetStateAction<number>) => {
    setSelectedTab(tabIdx);
    const toValue = tabIdx === 0 ? 0 : tabIdx === 1 ? width : width * 2;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
        <Text style={{ color: 'red', fontSize: 18 }}>{error}</Text>
      </View>
    );
  }

  const getFullName = (name: { first: string; middle?: string; last?: string }) => {
    return [name.first, name.middle, name.last].filter(Boolean).join(' ');
  };

  // สร้างฟังก์ชันใหม่สำหรับดึง currentUserData ตาม tab
  const getCurrentUserDataForTab = (tabIdx: number) => {
    const currentUserRank = tabIdx === 0 
      ? individualUserRank 
      : tabIdx === 1 
        ? schoolUserRank 
        : achievementUserRank;
    const currentUserLoading = userRankLoading || (tabIdx === 2 && achievementIdLoading);
    if (currentUserLoading || !currentUserRank) {
      return {
        name: { first: 'Loading...', last: '' },
        stepCount: 0,
        rank: 0,
        isLoading: true,
      };
    }
    return {
      name: currentUserRank.name || { first: 'Unknown', last: '' },
      stepCount: currentUserRank.stepCount || 0,
      rank: currentUserRank.rank || 0,
      isLoading: false,
    };
  };

  // usersData สำหรับ FlatList (ไม่รวมทีม) - แก้ไขการ slice
  const usersDataIndividual = individualUsers.length > 3 
    ? individualUsers.slice(3).map((u, idx) => ({
        name: u.user?.name || { first: 'Unknown' },
        stepCount: u.totalStep,
        rank: idx + 4,
        isTeam: false,
      }))
    : [];
  const usersDataGroup = groupUsers.length > 3
    ? groupUsers.slice(3).map((u, idx) => ({
        name: u.user?.name || { first: 'Unknown' },
        stepCount: u.totalStep,
        rank: idx + 4,
        isTeam: false,
      }))
    : [];
  const usersDataAchievement = achievementUsers.length > 3
    ? achievementUsers.slice(3).map((u, idx) => ({
        name: u.user?.name || { first: 'Unknown' },
        stepCount: u.totalStep,
        rank: idx + 4,
        isTeam: false,
      }))
    : [];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <SegmentedToggle
          value={selectedTab}
          onChange={handleTabChange}
        />
        </View>
      </View>

      <Animated.View
        style={{
          flexDirection: 'row',
          width: width * 3,
          flex: 1,
          transform: [{
            translateX: slideAnim.interpolate({
              inputRange: [0, width, width * 2],
              outputRange: [0, -width, -width * 2]
            })
          }]
        }}
      >
        {/* Individual Leaderboard */}
        <DynamicLeaderboard
          users={individualUsers}
          usersData={usersDataIndividual}
          currentUserData={getCurrentUserDataForTab(0)}
          getFullName={getFullName}
          width={width}
          height={height}
          cardNameStyle={styles.cardMyName}
        />
        {/* School/Group Leaderboard */}
        <DynamicLeaderboard
          users={groupUsers}
          usersData={usersDataGroup}
          currentUserData={getCurrentUserDataForTab(1)}
          getFullName={getFullName}
          width={width}
          height={height}
          cardNameStyle={styles.cardMyName}
        />
        {/* Achievement Leaderboard */}
        <DynamicLeaderboard
          users={achievementUsers}
          usersData={usersDataAchievement}
          currentUserData={getCurrentUserDataForTab(2)}
          getFullName={getFullName}
          width={width}
          height={height}
          cardNameStyle={styles.cardMyName}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
