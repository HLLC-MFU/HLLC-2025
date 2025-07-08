import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import TopUser from './TopUser';
import LeaderboardList from './LeaderboardList';
import { BlurView } from 'expo-blur';
import { Name } from '@/types/user';


const { width, height } = Dimensions.get('window');

const DynamicLeaderboard = ({
  users,
  currentUserData,
  valueLabel = 'steps',
}) => {


  const getShortName = (name: Name) => {
    const first = name?.first || '';
    const lastInitial = name?.last ? name.last.charAt(0) + '.' : '';
    return `${first} ${lastInitial}`.trim();
  };
  console.log('DynamicLeaderboard users:', users.users[1]);
  

  return (
    users && currentUserData && (
      <View style={{ width, flex: 1 }}>
        <View style={styles.top3Container}>
          {users.users[1] && (
            <TopUser
              rank={2}
              user={{
                name: {
                  first: getShortName(users.users[1].user?.name || { first: 'Unknown', last: '' }),
                  last: '',
                }, stepCount: users.users[1].totalStep
              }}
              valueLabel={valueLabel}
            />
          )}
          {users.users[0] && (
            <TopUser
              rank={1}
              user={{
                name: {
                  first: getShortName(users.users[0].user?.name || { first: 'Unknown', last: '' }),
                  last: '',
                }, stepCount: users.users[0].totalStep
              }}
              isMain
              crownImageSource={require('@/assets/images/crown3d.png')}
              valueLabel={valueLabel}
            />
          )}
          {users.users[2] && (
            <TopUser
              rank={3}
              user={{
                name: {
                  first: getShortName(users.users[2].user?.name || { first: 'Unknown', last: '' }),
                  last: '',
                }, stepCount: users.users[2].totalStep
              }}
              valueLabel={valueLabel}
            />
          )}
        </View>
        <View style={{ flex: 1, }} >
          <View style={{ marginVertical: height * 0.02 }}>
            {/* <LeaderboardList usersData={usersData.slice(0, 20)} valueLabel={valueLabel} /> */}
          </View>

          {/* Current User Card */}
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
            <BlurView intensity={60} tint="dark" style={{ borderRadius: width * 0.045, overflow: 'hidden' }}>
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
                  <Text style={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    backgroundColor: '#FFD700',
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    fontSize: 12,
                    zIndex: 20,
                  }}>Me</Text>
                </View>
                <Text style={styles.cardMyName}>
                  {currentUserData ? getShortName(currentUserData.data.user?.name) : "Loading..."}
                </Text>
                <Text style={styles.cardSteps}>
                  {currentUserData ? `${currentUserData.data.totalStep} ${valueLabel}` : "Loading..."}
                </Text>
              </View>
            </BlurView>
          </View>
        </View>
      </View>
    )
  );
};

export default DynamicLeaderboard;

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
});