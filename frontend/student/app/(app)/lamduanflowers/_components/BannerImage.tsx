import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function BannerImage() {
  return (
    <View style={styles.box}>
      <Image
        source={require('@/assets/images/lobby.png')} 
        style={styles.bannerImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    height: 120,             
    overflow: 'hidden',       
    borderRadius: 20,
    backgroundColor: '#ddd',
    position: 'relative',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '400%',          
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,             
  },
});
