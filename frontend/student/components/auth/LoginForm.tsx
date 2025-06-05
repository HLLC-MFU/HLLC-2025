import React from 'react';
import { Button, Input, SizableText, View, YStack, XStack } from 'tamagui';
import { PasswordInput } from '@/components/PasswordInput';
import { Linking, Image } from 'react-native';

interface LoginFormProps {
  username: string;
  setUsername: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  onLogin: () => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export const LoginForm = ({
  username,
  setUsername,
  password,
  setPassword,
  onLogin,
  onRegister,
  onForgotPassword,
}:LoginFormProps) => {
  return (
    <View flex={1} justifyContent="center" alignItems="center" padding="$4" rowGap={12}>
      <Image 
        source={require('@/assets/images/logo-sdad.png')}
        style={{ width: 120, height: 120, marginBottom: 16 }}
        resizeMode="contain"
      />
      
      <SizableText fontSize={24} fontWeight="bold" textAlign="center">Sign In</SizableText>
      <SizableText fontSize={18} fontWeight="bold" textAlign="center">Let's start your journey</SizableText>
      
      <YStack gap="$4" width={'100%'}>
        <Input
          height={50}
          width={'100%'}
          borderWidth={2}
          focusStyle={{ borderColor: '$colorFocus' }}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={{ backgroundColor: 'white' }}
        />
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
        />
      </YStack>

      <SizableText width={'100%'} textAlign="right" onPress={onForgotPassword}>
        Forgot Password?
      </SizableText>

      <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
        <Button flex={1} onPress={onRegister}>Register</Button>
        <Button flex={1} onPress={onLogin}>Sign In</Button>
      </View>

      <View style={{ backgroundColor: '#00000025', height: 1, width: '100%' }} />
      <Button width={'100%'} onPress={() => Linking.openURL('https://www.facebook.com/mfuactivities/')}>
        CONTACT US
      </Button>
    </View>
  );
}; 