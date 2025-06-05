import React, { useState } from 'react';
import { Input, XStack } from 'tamagui';
import { Eye, EyeOff } from '@tamagui/lucide-icons';
import { TouchableOpacity } from 'react-native';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export const PasswordInput = ({
  value,
  onChangeText,
  placeholder = 'Password',
  style,
}:PasswordInputProps) => {
  const [secureText, setSecureText] = useState(true);

  return (
    <XStack
      alignItems="center"
      borderWidth={2}
      borderColor={'$borderColor'}
      borderRadius="$4"
      focusStyle={{ borderColor: '$colorFocus' }}
      height={50}
      paddingRight={'$3'}
      style={[{ backgroundColor: 'white' }, style]}
    >
      <Input
        flex={1}
        placeholder={placeholder}
        secureTextEntry={secureText}
        value={value}
        onChangeText={onChangeText}
        borderWidth={0}
        style={{ backgroundColor: 'white' }}
      />
      <TouchableOpacity onPress={() => setSecureText(!secureText)}>
        {secureText ? <EyeOff size={24} /> : <Eye size={24} />}
      </TouchableOpacity>
    </XStack>
  );
}; 