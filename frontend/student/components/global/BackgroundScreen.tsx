import React, { ReactNode, useState } from 'react';
import { ImageBackground, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

export default function BackgroundScreen({
  background,
  children,
}: {
  background: string | null;
  children: ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);

  const uri = background
    ? { uri: `${process.env.EXPO_PUBLIC_API_URL}/uploads/${background}` }
    : require('@/assets/images/lobby.jpeg');

  const isVideo = background?.endsWith('.mp4');

  // Show loading spinner or blank while loading background
  const onLoadEnd = () => setLoaded(true);

  return (
    <View style={[StyleSheet.absoluteFill, { flex: 1, backgroundColor: '#000' }]}>
      {isVideo ? (
        <>
          <Video
            source={uri}
            isMuted={true}
            shouldPlay
            isLooping
            resizeMode={ResizeMode.COVER}
            style={[StyleSheet.absoluteFill, { flex: 1 }]}
            onLoad={onLoadEnd}
            onReadyForDisplay={onLoadEnd}
          />
          {loaded && children}
          {!loaded && (
            <View style={[StyleSheet.absoluteFill, styles.loading]}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </>
      ) : (
        <ImageBackground
          source={uri}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { flex: 1 }]}
          onLoadEnd={onLoadEnd}
        >
          {loaded ? children : (
            <View style={[StyleSheet.absoluteFill, styles.loading]}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </ImageBackground>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
