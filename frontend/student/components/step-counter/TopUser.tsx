import React from 'react';
import { View, Text, Image } from 'react-native';
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
}

interface TopUserProps {
  rank: 1 | 2 | 3;
  user?: User;
  isMain?: boolean;
  getFullName: (name: Name) => string;
  crownImageSource?: any;
}

const TopUser = ({ rank, user, isMain, getFullName, crownImageSource }:TopUserProps) => {
  const name = user ? getFullName(user.name) : '-';
  const steps = user ? user.stepCount : '-';

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
          <View style={innerStyle}>
            {/* ไม่ต้อง render avatar emoji */}
          </View>
        </BlurView>
        <View style={rankCircleStyle}>
          <Text style={rankTextStyle}>{rank}</Text>
        </View>
      </View>
      <Text style={nameStyle}>{name}</Text>
      <View style={underlineStyle} />
      <Text style={stepsStyle}>{steps} steps</Text>
    </View>
  );
};

export default TopUser; 