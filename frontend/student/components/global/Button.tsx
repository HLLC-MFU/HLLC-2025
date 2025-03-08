import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, ViewStyle, TextStyle } from "react-native";

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow" | "ghost";
  color?: string; // Allow any custom color
  size?: "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  isDisabled?: boolean;
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  fullWidth?: boolean;
  shadow?: boolean;
  outlined?: boolean;
  textTransform?: "uppercase" | "lowercase" | "capitalize" | "none";
  letterSpacing?: number;
  fontWeight?: "normal" | "bold" | "600" | "700";
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  margin?: number;
  opacity?: number;
}

const VARIANTS: Record<string, ViewStyle> = {
  solid: {},
  bordered: { borderWidth: 1 },
  light: {},
  flat: { backgroundColor: "transparent" },
  faded: { backgroundColor: "rgba(0,123,255,0.1)" },
  shadow: { shadowColor: "rgba(0, 0, 0, 0.2)", shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  ghost: { backgroundColor: "transparent" },
};

const SIZES: Record<string, ViewStyle & TextStyle> = {
  sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
  md: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 16 },
  lg: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 18 },
};

const RADIUS: Record<string, ViewStyle> = {
  none: { borderRadius: 0 },
  sm: { borderRadius: 4 },
  md: { borderRadius: 8 },
  lg: { borderRadius: 12 },
  full: { borderRadius: 9999 },
};

const DEFAULT_COLORS: Record<string, ViewStyle> = {
  default: { backgroundColor: "#E0E0E0" },
  primary: { backgroundColor: "#007BFF" },
  secondary: { backgroundColor: "#6C757D" },
  success: { backgroundColor: "#28A745" },
  warning: { backgroundColor: "#FFC107" },
  danger: { backgroundColor: "#DC3545" },
};

const TEXT_COLORS: Record<string, TextStyle> = {
  default: { color: "black" },
  primary: { color: "white" },
  secondary: { color: "white" },
  success: { color: "white" },
  warning: { color: "black" },
  danger: { color: "white" },
};

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = "solid",
  color = "default",
  size = "md",
  radius = "md",
  isDisabled = false,
  isLoading = false,
  startContent,
  endContent,
  fullWidth = false,
  shadow = false,
  outlined = false,
  textTransform = "none",
  letterSpacing = 0,
  fontWeight = "bold",
  borderColor,
  borderWidth,
  padding,
  margin,
  opacity,
}) => {
  const customBackgroundColor = color in DEFAULT_COLORS ? DEFAULT_COLORS[color] : { backgroundColor: color };
  const textColor = color in TEXT_COLORS ? TEXT_COLORS[color] : { color: "white" };
  const borderStyle: ViewStyle = outlined ? { borderWidth: borderWidth || 2, borderColor: borderColor || customBackgroundColor.backgroundColor } : {};

  return (
    <TouchableOpacity
      onPress={!isDisabled && !isLoading ? onPress : undefined}
      disabled={isDisabled || isLoading}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        customBackgroundColor,
        VARIANTS[variant],
        shadow && VARIANTS["shadow"],
        borderStyle,
        SIZES[size],
        RADIUS[radius],
        isDisabled && styles.disabled,
        padding !== undefined && { padding },
        margin !== undefined && { margin },
        opacity !== undefined && { opacity },
      ]}
    >
      <View style={styles.contentWrapper}>
        {startContent && <View style={styles.icon}>{startContent}</View>}
        {isLoading ? (
          <ActivityIndicator color={textColor.color} />
        ) : (
          <Text
            style={[
              styles.text,
              textColor,
              { textTransform, letterSpacing, fontWeight },
            ]}
          >
            {children}
          </Text>
        )}
        {endContent && <View style={styles.icon}>{endContent}</View>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,
  fullWidth: {
    width: "100%",
  } as ViewStyle,
  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,
  text: {
    fontWeight: "bold",
  } as TextStyle,
  icon: {
    marginHorizontal: 5,
  } as ViewStyle,
  disabled: {
    backgroundColor: "#B0B0B0",
  } as ViewStyle,
});

export default Button;