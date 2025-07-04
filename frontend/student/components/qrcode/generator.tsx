import React from "react";
import QRCode from "react-native-qrcode-svg";
import { useWindowDimensions } from 'react-native';

export default function QRCodeGenerator({ username, size }: { username: string; size?: number }) {
  const Logo = require("@/assets/images/sdad_logo.jpg");
  const { width } = useWindowDimensions();
  
  // Calculate responsive size based on screen width
  const responsiveSize = size || Math.min(width * 0.6, 280); // 60% of screen width, max 280px

  return (
        <QRCode
          value={username}
          size={responsiveSize}
          logo={Logo}
          logoSize={responsiveSize * 0.2} // 20% of QR code size
          color="white"
          backgroundColor="transparent"
          logoBackgroundColor="transparent"
        />
  );
};