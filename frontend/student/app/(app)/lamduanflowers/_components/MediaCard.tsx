import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { useLamduanFlowers } from '@/hooks/useLamduanFlowers';
import { TutorialModal } from './TutorialModal';

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
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  const tutorialPhotoUrl = latestSetting?.tutorialPhoto
    ? `http://localhost:8080/api/uploads/${latestSetting.tutorialPhoto}`
    : null;

  // console.log('tutorialVideo:', latestSetting?.tutorialVideo);
  // console.log('extracted videoId:', videoId);
  // console.log('lamduanSetting:', lamduanSetting);
  // console.log('latestSetting:', latestSetting);


  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Tutorial Video</Text>

      <TouchableOpacity
        style={styles.youtubeBox}
        onPress={() => {
          if (latestSetting?.tutorialVideo) {
            Linking.openURL(latestSetting.tutorialVideo);
          }
        }}
        disabled={!videoId}
      >
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <Text>No Video Found</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(true)}>
        <Text>Tutorial Modal</Text>
      </TouchableOpacity>

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
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  youtubeBox: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
});
