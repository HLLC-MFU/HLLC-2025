import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassLiquidButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const GlassLiquidButton = ({
  onPress,
  children,
  style,
  textStyle,
  disabled = false,
}: GlassLiquidButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      style={[styles.touchable, style, disabled && { opacity: 0.6 }]}
    >
      <BlurView intensity={50} tint="light" style={styles.blurContainer}>
        <View style={styles.inner}>
          <Text style={[styles.text, textStyle]}>{children}</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  blurContainer: {
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,60,0.18)',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  text: {
    color: '#222',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default GlassLiquidButton; 