import React from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import TopUser from './TopUser';
import { Name } from '@/types/user';
import { Ranking } from '@/hooks/useStepLeaderboard';
import LeaderboardList from './LeaderboardList';
import { BlurView } from 'expo-blur';
import useProfile from '@/hooks/useProfile';
import { Image } from 'expo-image';
import { useLanguage } from '@/context/LanguageContext';

const { width, height } = Dimensions.get('window');
type Props = {
  data: (Ranking & { rank?: number; completeStatus?: boolean })[] | Ranking[],
  currentUserData: {
    rank?: number;
    totalStep?: number;
    avatar?: string;
  }
  valueLabel?: string,
  displaySchoolName?: boolean;
}
export default function DynamicLeaderboard({ data, currentUserData, displaySchoolName }: Props) {
  const valueLabel = 'steps'; // or any other label you want to use
  const { user } = useProfile();
  const { language } = useLanguage();
  const getShortName = (name: Name) => {
    const first = name?.first || '';
    const lastInitial = name?.last ? name.last.charAt(0) + '.' : '';
    return `${first} ${lastInitial}`.trim();
  };

  return (
    <View style={{ width, flex: 1 }}>
      <View style={styles.top3Container}>
        {[1, 0, 2].map((index, i) => {
          const userData = data[index] ?? null;
          return (
            <TopUser
              key={index}
              rank={((index + 1) as 1 | 2 | 3)}
              user={{
                name: {
                  first: userData
                    ? getShortName(userData.user?.name || { first: 'Unknown', last: '' })
                    : '—',
                  last: '',
                },
                stepCount: userData?.totalStep || 0,
              }}
              valueLabel={valueLabel}
              isMain={index === 0}
              crownImageSource={index === 0 ? require('@/assets/images/crown3d.png') : undefined}
            />
          );
        })}
      </View>
      <View>
        <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', fontWeight: 'bold' }}>
          {user && displaySchoolName ? user?.data[0].metadata?.major?.school?.name[language] : ' '}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ marginVertical: height * 0.02, paddingBottom: height * 0.08 }}>
          <LeaderboardList data={data} valueLabel={valueLabel} />
        </View>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            marginHorizontal: width * 0.025,
            bottom: 0,
            zIndex: 10,
            borderRadius: width * 0.045,
            backgroundColor: 'rgba(255,255,255,0.13)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            overflow: 'hidden',
            marginBottom: height * 0.02,
          }}
        >
          <BlurView
            intensity={60}
            tint="dark"
            style={{
              borderRadius: width * 0.045,
              overflow: 'hidden',
              backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.9)' : 'transparent',
            }}
          >
            <View
              style={[
                styles.cardMyteam,
                {
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderColor: '#fff',
                },
              ]}
            >
              <View style={styles.cardRankCircle}>
                <Text style={styles.cardRankText}>
                  {currentUserData.rank || 'N/A'}
                </Text>
              </View>
              <View style={styles.cardMyAvatar}>
                {currentUserData.avatar ? (
                  <Image
                    source={{ uri: currentUserData.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {user?.data[0]?.name.first.charAt(0) || ''}
                      {user?.data[0]?.name.last?.charAt(0) || ''}
                    </Text>
                  </View>
                )}
                <Text style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  backgroundColor: '#FFD700',
                  color: '#fff',
                  fontWeight: 'bold',
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  fontSize: Platform.OS === 'ios' ? 12 : 10,
                  zIndex: 20,
                }}>Me</Text>
              </View>
              <Text style={styles.cardMyName}>
                {currentUserData ? getShortName(user?.data[0]?.name || { first: 'Unknown', last: '' }) : "Loading..."}
              </Text>
              <Text style={styles.cardSteps}>
                {currentUserData ? `${currentUserData.totalStep} ${valueLabel}` : "Loading..."}
              </Text>
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  top3Container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: height * 0.022,
    marginTop: height * 0.05,
  },
  cardMyteam: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: width * 0.045,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    padding: width * 0.03,
    paddingLeft: width * 0.045,
  },
  cardRankCircle: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: width * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.025,
  },
  cardRankText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: width * 0.04,
  },
  cardMyAvatar: {
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: width * 0.045,
    backgroundColor: '#fff',
    marginRight: width * 0.035,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b6c3d1',
    position: 'relative',
  },
  cardMyName: { color: '#fff', fontWeight: 'bold', flex: 1, fontSize: width * 0.04 },
  cardSteps: { color: '#b6c3d1', fontWeight: 'bold', fontSize: width * 0.0375 },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontWeight: 'bold',
    color: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});