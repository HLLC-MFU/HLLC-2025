import { View, ViewStyle, StyleSheet } from "react-native";
import { Plus, LucideIcon } from "lucide-react-native";
import { HapticTab } from "./HapticTab";

type FABProps = {
  onPress: () => void;
  icon?: LucideIcon;
  style?: ViewStyle;
};

export default function FAB({ onPress, icon: Icon, style }: FABProps) {
  const IconComponent = Icon ?? Plus;

  return (
    <View style={[styles.container]}>
      <HapticTab
        onPress={onPress}
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
        style={[styles.button, style]}
      >
        <IconComponent color="white" size={24} />
      </HapticTab>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 24,
    zIndex: 50,
  },
  button: {
    backgroundColor: "#2563EB", // tailwind "bg-blue-600"
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
  },
});
