import { BlurView } from 'expo-blur';
import { ImageBackground } from 'expo-image';
import { View, ViewStyle, StyleProp, ImageSourcePropType } from 'react-native';
import { ReactNode } from 'react';

type GlassButtonProps = {
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  blurStyle?: StyleProp<ViewStyle>;
  blurIntensity?: number;
  iconOnly?: boolean;
  backgroundImage?: ImageSourcePropType;
};

export function GlassButton({
  children,
  containerStyle,
  blurStyle,
  blurIntensity = 10,
  iconOnly = false,
  backgroundImage,
}: GlassButtonProps) {
  return (
    <View
      style={[
        {
          borderRadius: 999,
          overflow: 'visible',
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        },
        containerStyle,
      ]}
    >
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: iconOnly ? 12 : 16,
            paddingVertical: iconOnly ? 12 : 10,
            aspectRatio: iconOnly ? 1 : undefined,
          }}
        >
          {children}
        </ImageBackground>
      ) : (
        <BlurView
          intensity={blurIntensity}
          tint="regular"
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.3)',
              overflow: 'hidden',
              paddingHorizontal: iconOnly ? 12 : 16,
              paddingVertical: iconOnly ? 12 : 10,
              aspectRatio: iconOnly ? 1 : undefined,
            },
            blurStyle,
          ]}
        >
          {children}
        </BlurView>
      )}
    </View>
  );
}
