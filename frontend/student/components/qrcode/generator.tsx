import React from "react";
import QRCode from "react-native-qrcode-svg";
import { useWindowDimensions } from 'react-native';
import { BarcodeCreatorView, BarcodeFormat } from "react-native-barcode-creator";
import { StyleSheet } from "react-native";

export default function QRCodeGenerator({ username, size }: { username: string; size?: number }) {
  const Logo = require("@/assets/images/sdad_logo.jpg");
  const { width } = useWindowDimensions();

  const responsiveSize = size || Math.min(width * 0.5, 280);

  return (<>
    <QRCode
      value={username}
      size={responsiveSize}
      logo={Logo}
      logoSize={responsiveSize * 0.2}
      color="white"
      backgroundColor="transparent"
      logoBackgroundColor="transparent"
    />
    <BarcodeCreatorView
      value={username}
      background={'#FFFFFF'}
      foregroundColor={'#000000'}
      format={BarcodeFormat.CODE128}
      style={{ width: responsiveSize, height: 60, marginVertical: 20 }}
    />
  </>
  );
};