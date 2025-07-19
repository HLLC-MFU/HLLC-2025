import React, { useState } from 'react';
import { Button, Input, Text, View, XStack, YStack } from 'tamagui';
import { Linking, Image, Pressable } from 'react-native';
import { t } from 'i18next';
import { Globe } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trans } from 'react-i18next';
import { User, Lock, EyeClosed, Eye } from '@tamagui/lucide-icons';
import RegisterButton from './RegisterButton';
import ForgotPasswordPressable from './ForgotPasswordPressable';

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
}: LoginFormProps) => {
  const { language, changeLanguage } = useLanguage();
  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'th' : 'en');
  };
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);

  return (
    <>
      <View flex={1} justifyContent="center" alignItems="center" padding="$4" rowGap={12}>
        <SafeAreaView style={{ position: 'absolute', top: 0, right: 0, padding: 10 }}>
          <Pressable onPress={toggleLanguage} style={{ padding: 10 }}>
            <Globe size={24} color="#333" />
          </Pressable>
        </SafeAreaView>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 120, height: 120, marginBottom: 16, borderRadius: 32 }}
          resizeMode="contain"
        />

        <YStack gap="$0" width={'100%'} paddingHorizontal="$4">
          <Text fontSize={32} fontWeight={"600"} textAlign="center">{t("login.title")}</Text>
          <Text fontSize={18} fontWeight={"600"} textAlign="center">{t("login.subtitle")}</Text>
        </YStack>

        <YStack gap="$4" width={'100%'} marginTop={16}>
          <XStack {...inputContainerStyle}>
            <User />
            <Input
              height={50}
              flex={1}
              borderWidth={0}
              backgroundColor={'transparent'}
              placeholder={t("login.username")}
              value={username}
              onChangeText={setUsername}
              keyboardType="numeric"
              maxLength={10}
            />
          </XStack>
          <XStack {...inputContainerStyle}>
            <Lock />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor={'transparent'}
              value={password}
              onChangeText={setPassword}
              placeholder={t("login.password")}
              secureTextEntry={isPasswordVisible}
            />
            <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              {isPasswordVisible ? <EyeClosed /> : <Eye />}
            </Pressable>
          </XStack>

        </YStack>
        {/* <Text width={'100%'} textAlign="right" onPress={onForgotPassword}>
          {t("login.forgotPassword")}
        </Text> */}

        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end' }}>
          <ForgotPasswordPressable />
        </View>

        <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
          {/* <Button flex={1} onPress={onRegister}>{t("login.register")}</Button> */}
          <RegisterButton />
          <Button flex={1} onPress={onLogin}>{t("login.loginButton")}</Button>
        </View>

        <View style={{ backgroundColor: '#00000025', height: 1, width: '100%', marginTop: 24 }} />
        <Button width={'100%'} onPress={() => Linking.openURL('https://www.facebook.com/mfuactivities/')}>
          {t("login.contactUs")}
        </Button>

      </View>
      <Text textAlign="center" fontSize={10} color="#666" paddingBottom={24} marginHorizontal={24} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <Trans
          i18nKey="login.policy"
          components={{
            tos: <Text onPress={() => Linking.openURL('https://hllc.mfu.ac.th/terms-of-service')} />,
            privacy: <Text onPress={() => Linking.openURL('https://hllc.mfu.ac.th/privacy-policy')} />
          }}
        />
      </Text>
    </>
  );
};

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
