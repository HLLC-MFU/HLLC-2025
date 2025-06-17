import { ReactNode } from "react";
import { View, Image, ImageSourcePropType } from "react-native";

type IconImage = {
    children: ReactNode;
    iconImage?: ImageSourcePropType;
}

export function IconImage({ children, iconImage, }: IconImage) {
    return (
        <View>
            {iconImage ? (
                <Image
                    source={iconImage}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        width: 20,
                        height: 20,
                    }}
                />
            ) : (
                children
            )}
        </View>
    )
};