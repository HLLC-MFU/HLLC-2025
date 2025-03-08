import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from "react-native";

interface InputProps {
  variant?: "flat" | "bordered" | "faded" | "underlined";
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  label?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  description?: React.ReactNode;
  errorMessage?: React.ReactNode | ((v: string) => React.ReactNode);
  validate?: (value: string) => string | true | null | undefined;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  type?: "text" | "email" | "url" | "password" | "tel" | "search" | "file";
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  labelPlacement?: "inside" | "outside" | "outside-left";
  fullWidth?: boolean;
  isClearable?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  backgroundColor?: string; // New prop for background color
  onChange?: (text: string) => void;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
}

const radiusStyles: Record<string, ViewStyle> = {
  none: { borderRadius: 0 },
  sm: { borderRadius: 4 },
  md: { borderRadius: 8 },
  lg: { borderRadius: 12 },
  full: { borderRadius: 9999 },
};

const Input: React.FC<InputProps> = ({
  variant = "flat",
  color = "primary",
  size = "md",
  radius = "md",
  label,
  value,
  defaultValue = "",
  placeholder,
  description,
  errorMessage,
  validate,
  minLength,
  maxLength,
  pattern,
  type = "text",
  startContent,
  endContent,
  labelPlacement = "inside",
  fullWidth = true,
  isClearable = false,
  isRequired = false,
  isReadOnly = false,
  isDisabled = false,
  isInvalid = false,
  backgroundColor = "white", // Default background color
  onChange,
  onValueChange,
  onClear,
}) => {
  const [inputValue, setInputValue] = useState<string>(value || defaultValue);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    setInputValue(text);
    if (onChange) onChange(text);
    if (onValueChange) onValueChange(text);
    if (validate) {
      const validationError = validate(text);
      setError(typeof validationError === "string" ? validationError : null);
    }
  };

  const handleClear = () => {
    setInputValue("");
    if (onClear) onClear();
  };

  const keyboardType: KeyboardTypeOptions =
    type === "email" ? "email-address" : type === "tel" ? "phone-pad" : "default";

  return (
    <View style={[styles.container, fullWidth && styles.fullWidth]}>
      {label && labelPlacement !== "inside" && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          styles[variant],
          styles[size],
          radiusStyles[radius],
          { backgroundColor }, // Apply background color
        ]}
      >
        {startContent && <View style={styles.startContent}>{startContent}</View>}
        <TextInput
          style={[styles.input, isInvalid ? styles.invalid : {}]}
          placeholder={labelPlacement === "inside" ? (label as string) : placeholder}
          value={inputValue}
          onChangeText={handleChange}
          editable={!isReadOnly && !isDisabled}
          keyboardType={keyboardType}
          secureTextEntry={type === "password"}
          maxLength={maxLength}
        />
        {isClearable && inputValue.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text>X</Text>
          </TouchableOpacity>
        )}
        {endContent && <View style={styles.endContent}>{endContent}</View>}
      </View>
      {description && <Text style={styles.description}>{description}</Text>}
      {error && <Text style={styles.errorMessage}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  fullWidth: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
  },
  clearButton: {
    padding: 4,
    marginLeft: 6,
  },
  startContent: {
    marginRight: 6,
  },
  endContent: {
    marginLeft: 6,
  },
  description: {
    fontSize: 12,
    color: "gray",
  },
  errorMessage: {
    fontSize: 12,
    color: "red",
  },
  invalid: {
    borderColor: "red",
  },
  flat: {
    borderWidth: 0,
  },
  bordered: {
    borderWidth: 2,
  },
  faded: {
    backgroundColor: "#f0f0f0",
  },
  underlined: {
    borderBottomWidth: 1,
  },
  sm: {
    paddingVertical: 4,
  },
  md: {
    paddingVertical: 8,
  },
  lg: {
    paddingVertical: 12,
  },
});

export default Input;
