import React, { useState, useRef } from 'react';
import { View, Text, Alert, Dimensions, Animated } from 'react-native';
import { useStepLeaderboard } from '../../../hooks/useStepLeaderboard';
import TopUser from '../../../components/step-counter/TopUser';
import LeaderboardList from '../../../components/step-counter/LeaderboardList';
import SwitchButton from '../../../components/step-counter/SwitchButton';
import styles from '../../../components/step-counter/styles';
import useProfile from '../../../hooks/useProfile';
import { useGroupStepLeaderboard } from '../../../hooks/useStepLeaderboard';
import SegmentedToggle from '@/components/step-counter/SegmentedToggle';


export default function LeaderBoardScreen() {
  const [selectedTab, setSelectedTab] = useState(0); // 0: Individual, 1: School, 2: Achievement
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { user } = useProfile();
  const schoolId = user?.data?.[0]?.metadata?.major?.school?._id;

  const {
    users: individualUsers,
    loading: individualLoading,
    error: individualError,
  } = useStepLeaderboard();

  const {
    users: groupUsers,
    loading: groupLoading,
    error: groupError,
  } = useGroupStepLeaderboard(schoolId);

  const users = selectedTab === 0
    ? individualUsers
    : selectedTab === 1
      ? groupUsers.map(u => ({
          name: {
            first: u.user?.name?.first || 'Unknown',
            middle: u.user?.name?.middle || '',
            last: u.user?.name?.last || '',
          },
          stepCount: u.stepCount,
        }))
      : [];

  const loading = selectedTab === 0 ? individualLoading : selectedTab === 1 ? groupLoading : false;
  const error = selectedTab === 0 ? individualError : selectedTab === 1 ? groupError : null;

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

  // Mock your team data
  const yourTeam = {
    name: { first: 'Your', last: 'Team' },
    stepCount: 324,
    rank: 4,
  };

  // usersData สำหรับ FlatList (ไม่รวมทีม)
  const usersDataIndividual = individualUsers.slice(3).map((u, idx) => ({
    ...u,
    rank: idx + 4,
    isTeam: false,
  }));
  const usersDataGroup = groupUsers.map(u => ({
    name: {
      first: u.user?.name?.first || 'Unknown',
      middle: u.user?.name?.middle || '',
      last: u.user?.name?.last || '',
    },
    stepCount: u.stepCount,
    rank: 0, // จะจัดการ rank ใน FlatList
    isTeam: false,
  })).slice(3).map((u, idx) => ({ ...u, rank: idx + 4 }));

  // Mock achievement users data (20 อันดับ)
  const achievementUsers = Array.from({ length: 20 }, (_, i) => ({
    name: { first: `User${i+1}`, last: 'Achiever' },
    stepCount: 10000 - i * 300,
  }));
  const usersDataAchievement = achievementUsers.slice(3).map((u, idx) => ({
    ...u,
    rank: idx + 4,
    isTeam: false,
  }));

  return (
    <View style={styles.container}>
      {/* Leaderboard Title & Switch */}
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
        <View style={{ width, flex: 1 }}>
          <View style={styles.top3Container}>
            {individualUsers[1] && (
              <TopUser
                rank={2}
                user={individualUsers[1]}
                getFullName={getFullName}
              />
            )}
            {individualUsers[0] && (
              <TopUser
                rank={1}
                user={individualUsers[0]}
                isMain
                getFullName={getFullName}
                crownImageSource={require('@/assets/images/crown3d.png')}
              />
            )}
            {individualUsers[2] && (
              <TopUser
                rank={3}
                user={individualUsers[2]}
                getFullName={getFullName}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <LeaderboardList usersData={usersDataIndividual} getFullName={getFullName} />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                marginHorizontal: width * 0.04,
                marginBottom: height * 0.02,
                bottom: 0,
                zIndex: 10,
              }}
            >
              <View
                style={[
                  styles.cardMyteam,
                  {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                ]}
              >
                <View style={styles.cardRankCircle}>
                  <Text style={styles.cardRankText}>{yourTeam.rank}</Text>
                </View>
                <View style={styles.cardAvatar}>
                  
                </View>
                <Text style={[styles.cardMyName, { fontWeight: 'bold' }]}> 
                  {yourTeam.name.first + ' ' + yourTeam.name.last}
                </Text>
                <Text style={styles.cardMySteps}>{yourTeam.stepCount} steps</Text>
              </View>
            </View>
          </View>
        </View>
        {/* School/Group Leaderboard */}
        <View style={{ width, flex: 1 }}>
          <View style={styles.top3Container}>
            {groupUsers[1] && (
              <TopUser
                rank={2}
                user={{ name: {
                  first: groupUsers[1].user?.name?.first || 'Unknown',
                  middle: groupUsers[1].user?.name?.middle || '',
                  last: groupUsers[1].user?.name?.last || '',
                }, stepCount: groupUsers[1].stepCount }}
                getFullName={getFullName}
              />
            )}
            {groupUsers[0] && (
              <TopUser
                rank={1}
                user={{ name: {
                  first: groupUsers[0].user?.name?.first || 'Unknown',
                  middle: groupUsers[0].user?.name?.middle || '',
                  last: groupUsers[0].user?.name?.last || '',
                }, stepCount: groupUsers[0].stepCount }}
                isMain
                getFullName={getFullName}
                crownImageSource={require('@/assets/images/crown3d.png')}
              />
            )}
            {groupUsers[2] && (
              <TopUser
                rank={3}
                user={{ name: {
                  first: groupUsers[2].user?.name?.first || 'Unknown',
                  middle: groupUsers[2].user?.name?.middle || '',
                  last: groupUsers[2].user?.name?.last || '',
                }, stepCount: groupUsers[2].stepCount }}
                getFullName={getFullName}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <LeaderboardList usersData={usersDataGroup} getFullName={getFullName} />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                marginHorizontal: width * 0.04,
                marginBottom: height * 0.02,
                bottom: 0,
                zIndex: 10,
              }}
            >
              <View
                style={[
                  styles.cardMyteam,
                  {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                ]}
              >
                <View style={styles.cardRankCircle}>
                  <Text style={styles.cardRankText}>{yourTeam.rank}</Text>
                </View>
                <View style={styles.cardAvatar}>
                  
                </View>
                <Text style={[styles.cardName, { fontWeight: 'bold' }]}> 
                  {yourTeam.name.first + ' ' + yourTeam.name.last}
                </Text>
                <Text style={styles.cardMySteps}>{yourTeam.stepCount} steps</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Achievement Leaderboard */}
        <View style={{ width, flex: 1 }}>
          <View style={styles.top3Container}>
            {achievementUsers[1] && (
              <TopUser
                rank={2}
                user={achievementUsers[1]}
                getFullName={getFullName}
              />
            )}
            {achievementUsers[0] && (
              <TopUser
                rank={1}
                user={achievementUsers[0]}
                isMain
                getFullName={getFullName}
                crownImageSource={require('@/assets/images/crown3d.png')}
              />
            )}
            {achievementUsers[2] && (
              <TopUser
                rank={3}
                user={achievementUsers[2]}
                getFullName={getFullName}
              />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <LeaderboardList usersData={usersDataAchievement} getFullName={getFullName} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
