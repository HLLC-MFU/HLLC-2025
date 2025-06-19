import { Footprints } from "@tamagui/lucide-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { View, StyleProp, ViewStyle, Text } from "react-native";
import { Separator } from "tamagui";

type HomeHeroProps = {
  style?: StyleProp<ViewStyle>;
};

export default function HomeHero({ style }: HomeHeroProps) {

  return (
    <View
      style={[
        {
          width: "100%",
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {/* Background Panel */}
      <View
        style={{
          backgroundColor: "white",
          width: "100%",
          overflow: "hidden",
          height: 500,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 6,
          position: "relative",
        }}
      >
        <Image
          source="https://hllc.mfu.ac.th/v0/api/uploads/573beca699982baa96b230c05b8d2fac.jpg"
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={500}
        />
      </View>

      {/* Book Image */}
      <Image
        source="https://hllc.mfu.ac.th/book.png"
        style={{
          width: "100%",
          aspectRatio: 259 / 100,
          marginTop: -150,
          zIndex: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        }}
        contentFit="contain"
        transition={300}
      />

      {/* Avatar Image */}
      <Image
        source="https://hllc.mfu.ac.th/v0/api/uploads/1098b659b772822eb9bed9244eb89f9f10.png"
        style={{
          width: "150%",
          aspectRatio: 3 / 2,
          marginTop: -50,
          zIndex: 3,
          position: "absolute",
        }}
        contentFit="contain"
        transition={500}
      />

      <BlurView
        intensity={50}
        tint="light"
        style={{
          position: "absolute",
          bottom: -40,
          left: 16,
          right: 16,
          padding: 12,
          borderRadius: 16,
          borderColor: "rgba(255, 255, 255, 0.3)",
          borderWidth: 1,
          overflow: "hidden",
          zIndex: 50,
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 30,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Footprints color={"white"} />
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16, }}>
            12,000
          </Text>
        </View>
        <Separator alignSelf="stretch" vertical />
        <View style={{ alignItems: "center" }}>
          <Footprints color={"white"} />
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16, }}>
            12,000
          </Text>
        </View>
        <Separator alignSelf="stretch" vertical />
        <View style={{ alignItems: "center" }}>
          <Footprints color={"white"} />
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16,  }}>
            12,000
          </Text>
        </View>
      </BlurView>

    </View>
  );
}
