import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';

import { BlurView } from 'expo-blur';
import { GlassButton } from '@/components/ui/GlassButton';
import TutorialModal from './TutorialModal';

export default function MediaCard() {
  const [isModalVisible, setModalVisible] = useState(false);
  const { lamduanSetting } = useLamduanFlowers();
  const latestSetting = lamduanSetting?.[0];

  const extractYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url?.match(regex);
    return match ? match[1] : null;
  };

  const videoId = latestSetting?.tutorialVideo ? extractYouTubeId(latestSetting.tutorialVideo) : null;
  const tutorialPhotoUrl = latestSetting?.tutorialPhoto
    ? `${process.env.EXPO_PUBLIC_API_URL}/uploads/${latestSetting.tutorialPhoto}`
    : null;

  const screenWidth = Dimensions.get('window').width;
  const videoHeight = (screenWidth * 9) / 16;

  return (
    <View style={styles.wrapper}>
      {videoId ? (
        <View style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <WebView
            source={{ uri: `https://www.youtube.com/embed/${videoId}` }}
            style={{ flex: 1 }}
            allowsFullscreenVideo
          />
        </View>
      ) : (
        <Text>No Video Found</Text>
      )}

      <View style={styles.modalButton}>
        <GlassButton onPress={() => setModalVisible(true)}>
          <Text style={styles.modalButtonText}>Lamduan Tutorial</Text>
        </GlassButton>
      </View>

      <TutorialModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        photoUrl={tutorialPhotoUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 6,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  modalButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  modalButtonInner: {
    fontSize: 16,
    color: '#fff',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});
