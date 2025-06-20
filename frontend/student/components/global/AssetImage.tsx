import React, { useEffect, useState } from 'react';
import { Image, ImageStyle } from "react-native";
import { SvgXml } from 'react-native-svg';

type AssetImageProps = {
    uri: string;
    style?: ImageStyle;
}

export default function AssetImage({ uri, style }: AssetImageProps) {
    const isSvg = uri.toLowerCase().endsWith('.svg');
    const [svgXml, setSvgXml] = useState<string | null>(null);

    if (isSvg) {
        useEffect(() => {
            fetch(uri)
                .then((res) => res.text())
                .then((data) => setSvgXml(data))
                .catch((err) => {
                    console.warn('SVG load error:', err);
                    setSvgXml(null);
                });
        }, [uri]);

        return <SvgXml xml={svgXml} width={style?.width as number} height={style?.height as number}/>;
    }

    return <Image source={{ uri }} style={style} />;
}