import React from 'react';
import { Button, Input, SizableText, YStack, Sheet } from 'tamagui';
import { PasswordInput } from '@/components/PasswordInput';
import { ProvinceSelector } from '@/components/ProvinceSelector';
import { Province } from '@/types/auth';

interface RegisterFormProps {
  username: string;
  setUsername: (text: string) => void;
  password: string;
  setPassword: (text: string) => void;
  confirmPassword: string;
  setConfirmPassword: (text: string) => void;
  secret: string;
  setSecret: (text: string) => void;
  provinces: Province[];
  isProvinceSheetOpen: boolean;
  setIsProvinceSheetOpen: (open: boolean) => void;
  onRegister: () => void;
  onCancel: () => void;
}

export const RegisterForm = ({
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  secret,
  setSecret,
  provinces,
  isProvinceSheetOpen,
  setIsProvinceSheetOpen,
  onRegister,
  onCancel,
}:RegisterFormProps) => {
  return (
    <Sheet.Frame padding="$4" justifyContent="flex-start" alignItems="center" gap="$5">
      <SizableText fontSize={20} fontWeight="bold">Create Account</SizableText>
      <YStack gap="$3" width={'100%'}>
        <Input
          height={50}
          width={'100%'}
          borderWidth={2}
          focusStyle={{ borderColor: '$colorFocus' }}
          placeholder="Student ID"
          value={username}
          onChangeText={setUsername}
          style={{ backgroundColor: 'white' }}
        />
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
        />
        <PasswordInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
        />
        <Button
          width={'100%'}
          height={50}
          borderWidth={2}
          focusStyle={{ borderColor: '$colorFocus' }}
          style={{ backgroundColor: 'white' }}
          onPress={() => setIsProvinceSheetOpen(true)}
        >
          {secret ? provinces.find(p => p.name_en === secret)?.name_th : 'เลือกจังหวัด'}
        </Button>
        <Button width="100%" onPress={onRegister}>Create Account</Button>
        <Button width="100%" onPress={onCancel}>Cancel</Button>
      </YStack>

      <ProvinceSelector
        isOpen={isProvinceSheetOpen}
        onOpenChange={setIsProvinceSheetOpen}
        provinces={provinces}
        selectedProvince={secret}
        onSelect={setSecret}
      />
    </Sheet.Frame>
  );
}; 