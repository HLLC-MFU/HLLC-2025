import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

interface TopBarProps {
  onScan: () => void;
  onStamp: () => void;
  centerText?: string;
  onLeaderboard?: () => void;
}

export default function TopBar({
  onStamp,
  onLeaderboard,
}: TopBarProps) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.innerRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={onStamp}>
          <Image
            source={require('@/assets/images/logo-sdad.png')}
            style={styles.stampIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    minWidth: 260,
    paddingEnd: 20,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stampIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});
