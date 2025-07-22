import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, ImageSourcePropType } from 'react-native';
import { SvgXml } from 'react-native-svg';

type AssetImageProps = {
  uri: string | ImageSourcePropType;
  style?: ImageStyle;
};

export default function AssetImage({ uri, style }: AssetImageProps) {
  if (typeof uri !== 'string') {
    return <Image source={uri} style={style} />;
  }

  const isSvg = uri.toLowerCase().endsWith('.svg');
  const [svgXml, setSvgXml] = useState<string | null>(null);

  useEffect(() => {
    if (!isSvg) return;

    fetch(uri)
      .then((res) => res.text())
      .then((data) => setSvgXml(data))
      .catch((err) => {
        console.warn('SVG load error:', err);
        setSvgXml(null);
      });
  }, [uri]);

  if (isSvg && svgXml) {
    return (
      <SvgXml
        xml={svgXml}
        width={style?.width as number}
        height={style?.height as number}
      />
    );
  }

  return <Image source={{ uri: uri as string }} style={style} />;
}
