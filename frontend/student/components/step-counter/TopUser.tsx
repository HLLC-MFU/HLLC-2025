import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { BlurView } from 'expo-blur';
import styles from './styles';

interface Name {
  first: string;
  middle?: string;
  last?: string;
}

interface User {
  name: Name;
  stepCount: number;
  avatar?: string;
}

interface TopUserProps {
  rank: 1 | 2 | 3;
  user?: User;
  isMain?: boolean;
  crownImageSource?: ImageSourcePropType;
  valueLabel?: string;
}

const TopUser = ({ rank, user, isMain, crownImageSource, valueLabel = 'steps' }: TopUserProps) => {
  const steps = user ? user.stepCount : '-';
  console.log(user)

  // Style and element selection
  const outerStyle = isMain ? styles.glassProfileCircleOuterMain : styles.glassProfileCircleOuter;
  const innerStyle = isMain ? styles.profileCircleInnerMain : styles.profileCircleInner;
  const nameStyle = isMain ? styles.topNameMain : styles.topName;
  const stepsStyle = isMain ? styles.topStepsMain : styles.topSteps;
  const underlineStyle = isMain ? styles.underlineMain : styles.underline;
  const rankCircleStyle = rank === 1 ? styles.rankNumberCircle1 : rank === 2 ? styles.rankNumberCircle2 : styles.rankNumberCircle3;
  const rankTextStyle = isMain ? styles.rankNumberTextMain : styles.rankNumberText;

  return (
    <View style={isMain ? styles.topUserMain : styles.topUser}>
      {isMain && crownImageSource && (
        <View style={styles.crownWrap}>
          <Image source={crownImageSource} style={styles.crownImage} />
        </View>
      )}
      <View style={{ position: 'relative' }}>
        <BlurView intensity={isMain ? 60 : 40} tint="light" style={outerStyle}>
          <View style={[innerStyle, { backgroundColor: isMain ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)', alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarFallback, { width: isMain ? 60 : 50, height: isMain ? 60 : 50, backgroundColor: 'transparent', flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={[styles.avatarInitials, { fontSize: isMain ? 20 : 16 }]}>
                    {(() => {
                      const parts = (user?.name.first || '').split(' ')
                      const firstInitial = parts[0]?.charAt(0) || ''
                      const lastInitial = parts[1]?.charAt(0) || ''
                      return firstInitial + lastInitial
                    })()}
                  </Text>
                </View>
              )}
            </View>

          </View>
        </BlurView>
        <View style={rankCircleStyle}>
          <Text style={rankTextStyle}>{rank}</Text>
        </View>
      </View>
      <Text style={nameStyle}>{user?.name.first}</Text>
      <View style={underlineStyle} />
      <Text style={stepsStyle}>{steps} {valueLabel}</Text>
    </View>
  );
};

export default TopUser; 