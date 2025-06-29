import React, { useState, useRef } from 'react';
import { View, Text, Alert, Dimensions, Animated, SafeAreaView } from 'react-native';
import TopUser from '../../../components/step-counter/TopUser';
import LeaderboardList from '../../../components/step-counter/LeaderboardList';
import SwitchButton from '../../../components/step-counter/SwitchButton';
import styles from '../../../components/step-counter/styles';
import useProfile from '../../../hooks/useProfile';
import useStepLeaderboard, { useGroupStepLeaderboard } from '../../../hooks/useStepLeaderboard';
import useUserRank from '../../../hooks/useUserRank';
import SegmentedToggle from '@/components/step-counter/SegmentedToggle';
import DynamicLeaderboard from '../../../components/step-counter/DynamicLeaderboard';
import useStepAchievement from '../../../hooks/useStepAchievement';


export default function LeaderBoardScreen() {
  const [selectedTab, setSelectedTab] = useState(0); // 0: Individual, 1: School, 2: Achievement
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
  } = useStepLeaderboard();

  const {
    users: groupUsers,
    loading: groupLoading,
    error: groupError,
  } = useGroupStepLeaderboard(schoolId);

  const { achievements, loading: achievementIdLoading } = useStepAchievement();
  const currentAchievementId = achievements[0]?._id; // เลือกอันแรกสุด (หรือปรับ logic ได้)

  // ใช้ hook ใหม่สำหรับดึงข้อมูล rank ของผู้ใช้เอง
  const { userRank: individualUserRank, loading: individualUserRankLoading } = useUserRank('global');
  const { userRank: schoolUserRank, loading: schoolUserRankLoading } = useUserRank('school');
  const { userRank: achievementUserRank, loading: achievementUserRankLoading } = useUserRank('achieved', currentAchievementId);

  const users = selectedTab === 0
    ? individualUsers
    : selectedTab === 1
      ? groupUsers.map(u => ({
          name: {
            first: u.user?.name?.first || 'Unknown',
            middle: u.user?.name?.middle || '',
            last: u.user?.name?.last || '',
          },
          stepCount: u.totalStep,
        }))
      : selectedTab === 2
        ? achievementUsers.map(u => ({
            name: {
              first: u.user?.name?.first || 'Unknown',
              middle: u.user?.name?.middle || '',
              last: u.user?.name?.last || '',
            },
            stepCount: u.totalStep,
          }))
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

  // สร้างข้อมูลผู้ใช้เองจาก API response
  const getCurrentUserData = () => {
    const currentUserRank = selectedTab === 0 
      ? individualUserRank 
      : selectedTab === 1 
        ? schoolUserRank 
        : achievementUserRank;
    
    const currentUserLoading = selectedTab === 0 
      ? individualUserRankLoading 
      : selectedTab === 1 
        ? schoolUserRankLoading 
        : achievementUserRankLoading;

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

  const currentUserData = getCurrentUserData();

  // ตรวจสอบ loading state รวม
  const isOverallLoading = loading || 
    individualUserRankLoading || 
    schoolUserRankLoading || 
    achievementUserRankLoading ||
    achievementIdLoading;

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

  if (isOverallLoading) {
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
          <Text style={styles.leaderboardTitle}>{selectedTab === 0 ? 'INDIVIDUAL' : selectedTab === 1 ? 'SCHOOL' : 'ACHIEVEMENT'}</Text>
          <Text style={styles.leaderboardSubtitle}>LEADER BOARD</Text>
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
          currentUserData={currentUserData}
          getFullName={getFullName}
          width={width}
          height={height}
          cardNameStyle={styles.cardMyName}
        />
        {/* School/Group Leaderboard */}
        <DynamicLeaderboard
          users={groupUsers}
          usersData={usersDataGroup}
          currentUserData={currentUserData}
          getFullName={getFullName}
          width={width}
          height={height}
          cardNameStyle={styles.cardMyName}
        />
        {/* Achievement Leaderboard */}
        <DynamicLeaderboard
          users={achievementUsers}
          usersData={usersDataAchievement}
          currentUserData={currentUserData}
          getFullName={getFullName}
          width={width}
          height={height}
          cardNameStyle={styles.cardMyName}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
