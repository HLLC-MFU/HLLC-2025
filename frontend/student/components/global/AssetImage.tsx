import React, { useEffect, useState } from 'react';
import { Image } from "react-native";
import { SvgXml } from 'react-native-svg';

type AssetImageProps = {
    uri: string;
    style?: { width: number, height: number };
}

export default function AssetImage({
    uri,
    style = { width: 20, height: 20 }
}: AssetImageProps) {
    const isSvg = uri.toLowerCase().endsWith('.svg'); // Ex. {baseurl}/uploads/image.svg
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

        return <SvgXml xml={svgXml} width={style?.width as number} height={style?.height as number} />;
    }

    return <Image source={{ uri }} style={style} />;
}