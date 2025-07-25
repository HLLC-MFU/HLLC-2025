import React, { ReactNode, useEffect, useState } from 'react';
import { ImageBackground, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export default function BackgroundScreen({
  background,
  children,
}: {
  background: string | null;
  children: ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!background) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.loading]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Static video map (only known videos you bundled)
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
    // Add more here
  };

  const fallbackImage = require('@/assets/images/lobby/MED.mp4');

  const isVideo = background in videoMap;
  const uri = isVideo ? videoMap[background] : fallbackImage;

  const player = useVideoPlayer(isVideo ? uri : undefined, (player) => {
    player.loop = true;
    player.play();
    setLoaded(true);
  });

  return (
    <View style={[StyleSheet.absoluteFill, { flex: 1, backgroundColor: '#000' }]}>
      {isVideo ? (
        <>
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
        </>
      ) : (
        <ImageBackground
          source={uri}
          resizeMode="cover"
          style={[StyleSheet.absoluteFill, { flex: 1 }]}
          onLoadEnd={() => setLoaded(true)}
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
