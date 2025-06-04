import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';

const Loader = () => (
  <View style={[styles.container, styles.centerContent]}>
    <StatusBar barStyle="light-content" />
    <ActivityIndicator size="large" color="#0A84FF" />
    <Text style={styles.loadingText}>กำลังโหลด...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: {
    color: '#0A84FF',
    marginTop: 12,
    fontSize: 16,
  },
});

export default Loader; 