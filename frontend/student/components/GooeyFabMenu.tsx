import React, { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { View, TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlignJustify } from '@tamagui/lucide-icons';
import { Easing } from 'react-native';
import AssetImage from './global/AssetImage';

interface SubFab {
  key: string;
  icon?: ReactNode;
  label?: string | null;
  onPress: () => void;
}

interface GooeyFabMenuProps {
  assets: Record<string, string>;
  subFabs: SubFab[];
  style?: object;
}

export default function GooeyFabMenu({
  assets,
  subFabs,
  style
}: GooeyFabMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const coinAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;
  const createAnim = useRef(new Animated.Value(0)).current;

  const anims = [createAnim, stepAnim, coinAnim];

  const openMenu = () => {
    setIsMenuOpen(true);
    Animated.stagger(
      50,
      anims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        })
      )
    ).start();
  };

  const closeMenu = () => {
    Animated.stagger(
      50,
      anims.map(anim =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.in(Easing.exp),
        })
      ).reverse()
    ).start(() => setIsMenuOpen(false));
  };

  const toggleMenu = () => {
    if (isMenuOpen) closeMenu();
    else openMenu();
  };

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {isMenuOpen && (
        <BlurView
          intensity={30}
          tint="systemMaterialDark"
          style={styles.blurOverlay}
          pointerEvents="auto"
        >
          <TouchableOpacity
            style={{ flex: 1, width: '100%', height: '100%' }}
            activeOpacity={1}
            onPress={closeMenu}
          />
        </BlurView>
      )}

      {subFabs.map((fab, idx) => {
        const asset = assets[fab.key];
        const anim = anims[idx] || anims[0];
        return (
          <Animated.View
            key={fab.key}
            pointerEvents={isMenuOpen ? 'auto' : 'none'}
            style={[
              styles.fabSubButton,
              {
                position: 'absolute',
                right: -120,
                bottom: 70 * (subFabs.length - 2.5 - idx),
                zIndex: 2,
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [70, 0],
                    }),
                  },
                  { scale: anim },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.fabSubButtonInner}
              onPress={() => {
                fab.onPress();
                closeMenu();
              }}
              activeOpacity={0.9}
            >
              {asset ? <AssetImage uri={`${process.env.EXPO_PUBLIC_API_URL}/uploads/${asset}`} style={{ width: 24, height: 24 }} /> : fab.icon}
              {fab.label && <Text style={styles.stepCounterFabText}>{fab.label}</Text>}
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      <View style={{ zIndex: 3 }}>
        <TouchableOpacity
          style={styles.enhancedFab}
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFill, styles.fabGradient]}>
            {assets.menu ? (
              <AssetImage uri={`${process.env.EXPO_PUBLIC_API_URL}/uploads/${assets.menu}`} style={{ width: 24, height: 24 }} />
            ) : (
              <AlignJustify
                size={24}
                color="#fff"
                style={{ transform: [{ rotate: isMenuOpen ? '45deg' : '0deg' }] }}
              />
            )}
          </BlurView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    width: 80,
    height: 300,
  },
  blurOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 3000,
    height: 3000,
    zIndex: 1,
  },
  enhancedFab: {
    position: 'absolute',
    bottom: 120,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200,200,200,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabGradient: {
    borderRadius: 9999,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fabSubButton: {
    right: 70,
    width: 200,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
  },
  fabSubButtonInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stepCounterFabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
    flexShrink: 1,
    maxWidth: 140,
    textAlign: 'center',
  }
});
