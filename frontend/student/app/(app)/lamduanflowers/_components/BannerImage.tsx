import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function BannerImage() {
  return (
    <View style={styles.box}>
      <Image
        source={{
          uri: 'https://www.royalparkrajapruek.org/img/upload/20210309-6046ece04a35c.jpg',
        }}
        style={styles.bannerImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    resizeMode: 'cover',
  },
});
