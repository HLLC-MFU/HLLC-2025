import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, AppStateStatus, AppState } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function BackgroundScreen({
  acronym,
  children,
}: {
  acronym: string;
  children: ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const videoMap: Record<string, any> = {
    ADT: require('@/assets/images/lobby/ADT.mp4'),
    AI: require('@/assets/images/lobby/AI.mp4'),
    CSC: require('@/assets/images/lobby/CSC.mp4'),
    DENT: require('@/assets/images/lobby/DENT.mp4'),
    HS: require('@/assets/images/lobby/HS.mp4'),
    IM: require('@/assets/images/lobby/IM.mp4'),
    LAW: require('@/assets/images/lobby/LAW.mp4'),
    LA: require('@/assets/images/lobby/LA.mp4'),
    SOM: require('@/assets/images/lobby/SOM.mp4'),
    MED: require('@/assets/images/lobby/MED.mp4'),
    NS: require('@/assets/images/lobby/NS.mp4'),
    SCI: require('@/assets/images/lobby/SCI.mp4'),
    SINO: require('@/assets/images/lobby/SINO.mp4'),
    SOCIN: require('@/assets/images/lobby/SOCIN.mp4'),
  };

  const fallbackVideo = require('@/assets/images/lobby/MED.mp4');
  const uri = videoMap[acronym] ?? fallbackVideo;

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.play();
    setLoaded(true);
  });

  // Handle AppState changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come back to the foreground
        if (player?.play) {
          player.play();
        }
      }

      if (nextAppState.match(/inactive|background/)) {
        if (player?.pause) {
          player.pause(); // Optional: you can remove this if you want it to *keep* playing in background
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  if (!acronym) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.loading]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { flex: 1, backgroundColor: '#000' }]}>
      <VideoView
        style={[StyleSheet.absoluteFill, { flex: 1 }]}
        player={player}
        pointerEvents="none"
        contentFit="cover"
      />
      {loaded ? children : (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
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
