import React, { useState } from 'react';
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

export const ResetPasswordForm = ({
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
}:ResetPasswordFormProps) => {
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    secret: '',
  });

  const validateForm = () => {
    const newErrors = {
      username: '',
      password: '',
      confirmPassword: '',
      secret: '',
    };
    let isValid = true;

    if (!username) {
      newErrors.username = 'กรุณากรอกรหัสนักศึกษา';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'กรุณากรอกรหัสผ่านใหม่';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
      isValid = false;
    }

    if (!secret) {
      newErrors.secret = 'กรุณาเลือกจังหวัด';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleReset = () => {
    if (validateForm()) {
      onReset();
    }
  };

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
            <Label>รหัสนักศึกษา</Label>
            <Input
              height={50}
              width={'100%'}
              borderWidth={2}
              focusStyle={{ borderColor: '$colorFocus' }}
              placeholder="6xxxxxxx"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setErrors(prev => ({ ...prev, username: '' }));
              }}
              style={{ backgroundColor: 'white' }}
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.username ? (
              <SizableText color="$red10" fontSize={12}>{errors.username}</SizableText>
            ) : null}
          </YStack>

          <YStack space="$1">
            <Label>รหัสผ่านใหม่</Label>
            <PasswordInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder="รหัสผ่านใหม่"
            />
            {errors.password ? (
              <SizableText color="$red10" fontSize={12}>{errors.password}</SizableText>
            ) : null}
          </YStack>

          <YStack space="$1">
            <Label>ยืนยันรหัสผ่านใหม่</Label>
            <PasswordInput
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              placeholder="ยืนยันรหัสผ่านใหม่"
            />
            {errors.confirmPassword ? (
              <SizableText color="$red10" fontSize={12}>{errors.confirmPassword}</SizableText>
            ) : null}
          </YStack>

          <YStack space="$1">
            <Label>จังหวัด</Label>
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
            {errors.secret ? (
              <SizableText color="$red10" fontSize={12}>{errors.secret}</SizableText>
            ) : null}
          </YStack>

          <Button 
            width="100%" 
            onPress={handleReset}
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
        onSelect={(value) => {
          setSecret(value);
          setErrors(prev => ({ ...prev, secret: '' }));
        }}
      />
    </Sheet.Frame>
  );
}; 