import React from 'react';
import { Button, Input, SizableText, YStack, XStack, Sheet, Label } from 'tamagui';
import { PasswordInput } from '@/components/PasswordInput';
import { ProvinceSelector } from '@/components/ProvinceSelector';
import { Province } from '@/types/auth';

interface ResetPasswordFormProps {
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
  isLoading: boolean;
  onReset: () => void;
  onClose: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
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
  isLoading,
  onReset,
  onClose,
}) => {
  return (
    <Sheet.Frame padding="$4" flex={1}>
      <Sheet.Handle />
      <YStack space="$4" flex={1}>
        <XStack justifyContent="space-between" alignItems="center">
          <SizableText fontSize={24} fontWeight="bold">รีเซ็ตรหัสผ่าน</SizableText>
          <Button onPress={onClose} chromeless>
            <XStack space="$2" alignItems="center">
              <SizableText>ปิด</SizableText>
            </XStack>
          </Button>
        </XStack>

        <YStack space="$3">
          <YStack space="$1">
            <Label htmlFor="reset-username">รหัสนักศึกษา</Label>
            <Input
              id="reset-username"
              height={50}
              width={'100%'}
              borderWidth={2}
              focusStyle={{ borderColor: '$colorFocus' }}
              placeholder="6xxxxxxx"
              value={username}
              onChangeText={setUsername}
              style={{ backgroundColor: 'white' }}
              keyboardType="numeric"
              maxLength={8}
            />
          </YStack>

          <YStack space="$1">
            <Label htmlFor="reset-password">รหัสผ่านใหม่</Label>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder="รหัสผ่านใหม่"
            />
          </YStack>

          <YStack space="$1">
            <Label htmlFor="reset-confirm-password">ยืนยันรหัสผ่านใหม่</Label>
            <PasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="ยืนยันรหัสผ่านใหม่"
            />
          </YStack>

          <YStack space="$1">
            <Label htmlFor="reset-secret">จังหวัด</Label>
            <Button
              id="reset-secret"
              width={'100%'}
              height={50}
              borderWidth={2}
              focusStyle={{ borderColor: '$colorFocus' }}
              style={{ backgroundColor: 'white' }}
              onPress={() => setIsProvinceSheetOpen(true)}
            >
              {secret ? provinces.find(p => p.name_en === secret)?.name_th : 'เลือกจังหวัด'}
            </Button>
          </YStack>

          <Button 
            width="100%" 
            onPress={onReset}
            disabled={isLoading}
            opacity={isLoading ? 0.7 : 1}
          >
            {isLoading ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'รีเซ็ตรหัสผ่าน'}
          </Button>
        </YStack>
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