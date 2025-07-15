import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Button,
  Input,
  SizableText,
  YStack,
  XStack,
  Separator,
} from 'tamagui';
import { ProvinceSelector } from '@/components/ProvinceSelector';
import { Province } from '@/types/auth';
import { apiRequest } from '@/utils/api';
import { Pressable, ActivityIndicator } from 'react-native';
import {
  User,
  Lock,
  EyeClosed,
  Eye,
  Map,
  ChevronDown,
} from '@tamagui/lucide-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { t } from 'i18next';
import { useLanguage } from '@/context/LanguageContext';

interface ResetPasswordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  onResetPassword: () => void;
}

export const ResetPasswordForm = ({
  open,
  onOpenChange,
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
  onResetPassword,
}: ResetPasswordFormProps) => {
  const [name, setName] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(true);
  const [isLoadingUsername, setIsLoadingUsername] = useState(false);
  const {language} = useLanguage();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const fetchUserInfo = async (inputUsername: string, inputProvince: string) => {
    if (inputUsername.length !== 10 || !/^[0-9]+$/.test(inputUsername)) {
      alert('Student ID must be 10 digits numeric.');
      setUsername('');
      return;
    }

    setIsDisabled(true);
    setIsLoadingUsername(true);

    try {
      const res = await apiRequest<{
        user?: { name: { first: string; middle?: string; last: string }; province: string };
      }>(`/auth/check-reset-password-eligibility`, 'POST', {
        username: inputUsername,
        secret: inputProvince,
      });

      if (res.statusCode === 201 && res.data?.user) {
        const u = res.data.user;
        const fullName = `${u.name.first}${u.name.middle ? ' ' + u.name.middle : ''} ${u.name.last}`;
        setName(fullName.trim());
      } else if (res.message === "Invalid secret") {
        alert('Invalid province or secret. Please try again.');
        setUsername('');
        setName('');
        setSecret('');
      } else {
        alert(res.message || 'Invalid user.');
        setUsername('');
        setName('');
        setSecret('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsername(false);
      setIsDisabled(false);
    }
  };
  useEffect(() => {
    setName('');
    if (username.length === 10 && /^[0-9]+$/.test(username) && secret) {
      fetchUserInfo(username, secret);
    }
  }, [username, secret]);

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [open]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onOpenChange(false);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setSecret('');
        setName('');
        setIsPasswordVisible(true);
        setIsConfirmPasswordVisible(true);
        setIsDisabled(false);
        setIsLoadingUsername(false);
      }
    },
    [onOpenChange, setUsername, setPassword, setConfirmPassword, setSecret]
  );

  const inputContainerStyle = {
    alignItems: 'center' as const,
    borderWidth: 2,
    paddingHorizontal: 12,
    height: 48,
    borderColor: '$borderColor',
    borderRadius: 16,
    focusStyle: {
      borderColor: '$colorFocus',
    },
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['90%']}
        enablePanDownToClose
        onChange={handleSheetChanges}
      >
        <BottomSheetView style={{ flex: 1, padding: 16 }}>
          <SizableText fontSize={20} fontWeight="bold" marginBottom="$4">
            {t("resetPassword.title")}
          </SizableText>
          <YStack gap="$3" width="100%">
            <XStack {...inputContainerStyle}>
              <User />
              <Input
                flex={1}
                borderWidth={0}
                backgroundColor={'transparent'}
                placeholder={t("resetPassword.username")}
                value={username}
                onChangeText={setUsername}
                onBlur={() => {
                  if (username.length !== 10 || !/^\d+$/.test(username)) {
                    alert('Student ID must be 10 digits numeric.');
                    setUsername('');
                  }
                }}
                editable={!isDisabled}
                keyboardType="numeric"
                maxLength={10}
              />
              {isLoadingUsername && <ActivityIndicator size="small" color="#888" />}
            </XStack>
            <XStack {...inputContainerStyle} onPress={() => setIsProvinceSheetOpen(true)} disabled={isDisabled}>
              <Map />
              <Input
                flex={1}
                editable={false}
                pointerEvents="none"
                borderWidth={0}
                backgroundColor="transparent"
                placeholder={t("resetPassword.province")}
                value={secret ? provinces.find((p) => p.name_en === secret)?.[`name_${language}`] ?? '' : ''}
              />
              <ChevronDown />
            </XStack>



            <XStack {...inputContainerStyle}>
              <User />
              <Input flex={1} borderWidth={0} backgroundColor={'transparent'} placeholder={t("resetPassword.studentName")} value={name} editable={false} />
            </XStack>

            <XStack {...inputContainerStyle}>
              <Lock />
              <Input
                flex={1}
                borderWidth={0}
                backgroundColor={'transparent'}
                placeholder={t("resetPassword.newPassword")}
                value={password}
                onChangeText={setPassword}
                editable={!isDisabled}
                secureTextEntry={isPasswordVisible}
                onBlur={() => {
                  if (password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
                    alert('Password must be at least 8 characters long and include uppercase, lowercase, and number.');
                    setPassword('');
                  }
                }}
              />
              <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                {isPasswordVisible ? <EyeClosed /> : <Eye />}
              </Pressable>
            </XStack>

            <XStack {...inputContainerStyle}>
              <Lock />
              <Input
                flex={1}
                borderWidth={0}
                backgroundColor={'transparent'}
                placeholder={t("resetPassword.confirmPassword")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isDisabled}
                secureTextEntry={isConfirmPasswordVisible}
                onBlur={() => {
                  if (password !== confirmPassword) {
                    alert('Passwords do not match.');
                    setConfirmPassword('');
                  }
                }}
              />
              <Pressable onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                {isConfirmPasswordVisible ? <EyeClosed /> : <Eye />}
              </Pressable>
            </XStack>


            <XStack width="100%">
              <Button flex={1} onPress={onResetPassword} disabled={isDisabled}>
                {t("resetPassword.resetButton")}
              </Button>
            </XStack>

            <Separator />

            <Pressable onPress={() => onOpenChange(false)} style={{ width: '100%' }}>
              <SizableText fontSize={16} textAlign="center" color="$color">
                {t("resetPassword.loginPrompt")} <SizableText fontWeight="bold"> {t("resetPassword.backToLogin")}</SizableText>
              </SizableText>
            </Pressable>
          </YStack>

          {/* Province Selector bottom sheet */}
          <ProvinceSelector
            isOpen={isProvinceSheetOpen}
            onOpenChange={setIsProvinceSheetOpen}
            provinces={provinces}
            selectedProvince={secret}
            onSelect={setSecret}
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  );
};