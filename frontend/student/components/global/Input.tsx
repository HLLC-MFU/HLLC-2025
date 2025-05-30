import React, { FC, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Platform,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedDarkInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<ViewStyle>; // ✅ Support style prop
}

const Input: FC<AnimatedDarkInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const labelPosition = useSharedValue(value ? 1 : 0);
  const borderColor = useSharedValue('#374151'); // gray-700

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    top: withTiming(labelPosition.value === 1 ? -10 : 14, { duration: 200 }),
    fontSize: withTiming(labelPosition.value === 1 ? 12 : 16, {
      duration: 200,
    }),
    color: withTiming(labelPosition.value === 1 ? '#9ca3af' : '#6b7280', {
      duration: 200,
    }),
  }));

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(isFocused ? '#3b82f6' : '#374151', {
      duration: 200,
    }),
  }));

  useEffect(() => {
    if (isFocused || value.length > 0) {
      labelPosition.value = 1;
    } else {
      labelPosition.value = 0;
    }
  }, [isFocused, value]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, style, borderAnimatedStyle]}>
        <TextInput
          style={styles.input}
          placeholder=""
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          placeholderTextColor="#6b7280"
          {...rest}
        />
        <Animated.Text style={[styles.label, labelAnimatedStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  container: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#1f2937', // dark gray-800
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    fontSize: 16,
    color: '#f9fafb', // white-ish
    padding: 0,
    margin: 0,
  },
  label: {
    position: 'absolute',
    left: 16,
    paddingHorizontal: 2,
  },
});

export default Input;
