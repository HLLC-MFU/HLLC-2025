
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

type FadeViewProps = {
  children: React.ReactNode;
};
export default function FadeView({ children }: FadeViewProps) {
  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{ flex: 1 }}
        entering={FadeIn}
        exiting={FadeOut}
      >
        {children}
      </Animated.View>
    </View>
  );
}