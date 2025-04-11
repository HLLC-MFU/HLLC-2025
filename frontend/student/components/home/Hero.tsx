import useProfile from "@/hooks/useProfile";
import { Image } from "expo-image";
import { View, StyleProp, ViewStyle } from "react-native";


type HomeHeroProps = {
  style?: StyleProp<ViewStyle>;
};

export default function HomeHero({ style }: HomeHeroProps) {
  const { user } = useProfile();

  return (
    <View style={[{ width: "100%", borderRadius: 16, alignContent: "center" }, style]}>
      <View style={{ alignItems: "center" }}>
        {/* Background Image */}
        <View
          style={{
            backgroundColor: "white",
            width: "100%",
            borderRadius: 16,
            overflow: "hidden",
            top: 80,
            height: 260,
            position: "absolute",
          }}
        >
          <Image
            source={user?.theme.assets.background}
            style={{ height: "100%" }}
            contentFit="cover"
            transition={500}
          />
        </View>

        {/* Avatar Image */}
        <Image
          source={user?.major.school.photos.fourth}
          style={{ width: "120%", aspectRatio: 3 / 2, zIndex: 1 }}
          contentFit="contain"
          transition={500}
        />
      </View>

      {/* Book Image */}
      <Image
        source="https://hllc.mfu.ac.th/book.png"
        contentFit="contain"
        style={{ width: "100%", aspectRatio: 259 / 100, top: -60, zIndex: 0 }}
        transition={300}
      />
    </View>
  );
}
