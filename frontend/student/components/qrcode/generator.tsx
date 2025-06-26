import React from "react";
import QRCode from "react-native-qrcode-svg";

export default function QRCodeGenerator({ username }: { username: string }) {
  const Logo = require("@/assets/images/sdad_logo.jpg");

  return (
        <QRCode
          value={username}
          size={250}
          logo={Logo}
          logoSize={50}
          color="white"
          backgroundColor="transparent"
          logoBackgroundColor="transparent"
        />
  );
};