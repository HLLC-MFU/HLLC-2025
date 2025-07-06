import { ReactNode } from 'react';
import { ImageBackground, View, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export default function BackgroundScreen({
  background,
  children,
}: {
  background: string | null;
  children: ReactNode;
}) {
  const uri = background
    ? {
        uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${background}`,
      }
    : require('@/assets/images/lobby.png');

  return (
    <View style={[StyleSheet.absoluteFill, { flex: 1 }]}>
      {background?.endsWith('.mp4') ? (
        <View style={{ flex: 1 }}>
          <Video
            source={uri}
            isMuted={true}
            shouldPlay
            isLooping
            resizeMode={ResizeMode.COVER}
            style={[StyleSheet.absoluteFill, { flex: 1 }]}
          />
          {children}
        </View>
      ) : (
        <ImageBackground
          source={uri}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { flex: 1 }]}
        >
          {children}
        </ImageBackground>
      )}
    </View>
  );
}
