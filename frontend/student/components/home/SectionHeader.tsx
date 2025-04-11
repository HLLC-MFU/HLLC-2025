import useProfile from "@/hooks/useProfile";
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from "react-native";


type SectionHeaderProps = {
  title: string;
  rightText?: string;
  onPressRight?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export default function SectionHeader({
  title,
  rightText = "See all",
  onPressRight,
  containerStyle,
  titleStyle,
}: SectionHeaderProps) {
  const { user } = useProfile();

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      <TouchableOpacity onPress={onPressRight}>
        <Text style={[styles.rightText, { color: user?.theme?.colors?.primary ?? "#00f" }]}>
          {rightText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  rightText: {
    fontSize: 14,
    fontWeight: "bold",
    paddingLeft: 16,
  },
});
