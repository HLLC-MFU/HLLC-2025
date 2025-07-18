import React from 'react';
import { Text, View, StyleSheet, Dimensions } from 'react-native';

export default function Barcode({ value }: { value: string }) {
  const screenWidth = Dimensions.get('window').width;

  const responsiveFontSize = screenWidth * 0.1;

  const barcodeValue = `*${value}*`;

  return (
    <View style={styles.container}>
      <Text style={[styles.barcode, { fontSize: responsiveFontSize, transform: [{ scaleY: 1.5 }] }]}>
        {barcodeValue}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  barcode: {
    fontFamily: 'LibreBarcode39',
    color: '#fff',
  },
});
