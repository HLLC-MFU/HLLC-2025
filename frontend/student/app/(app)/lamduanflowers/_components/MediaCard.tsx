import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';
import { TutorialModal } from './TutorialModal';
import { BlurView } from 'expo-blur';

export function MediaCard() {
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

      <BlurView intensity={40} tint="light" style={styles.modalButton}>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.modalButtonInner}>
          <Text style={styles.modalButtonText}>Lamduan Tutorial</Text>
        </TouchableOpacity>
      </BlurView>

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
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  modalButton: {
    borderRadius: 999,
    overflow: 'hidden',
    alignSelf: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalButtonInner: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});
