import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface TopBarProps {
  onScan: () => void;
  onStamp: () => void;
  centerText?: string;
}

export default function TopBar({
  onScan,
  onStamp,
  centerText = '',
}: TopBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.innerRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={onScan}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="#fff" />
        </TouchableOpacity>
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
    paddingEnd: 20
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
