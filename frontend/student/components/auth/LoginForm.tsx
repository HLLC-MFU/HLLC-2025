import React from 'react';
import { Button, Input, Text, View, YStack } from 'tamagui';
import { PasswordInput } from '@/components/PasswordInput';
import { Linking, Image, Pressable, StyleSheet } from 'react-native';
import { t } from 'i18next';
import { Globe } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trans } from 'react-i18next';

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
}: LoginFormProps) => {
  const { language, changeLanguage } = useLanguage();
  const toggleLanguage = () => {
    changeLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <>
      <View flex={1} justifyContent="center" alignItems="center" padding="$4" rowGap={12}>
        <SafeAreaView style={{ position: 'absolute', top: 0, right: 0, padding: 10 }}>
          <Pressable onPress={toggleLanguage} style={{ padding: 10 }}>
            <Globe size={24} color="#333" />
          </Pressable>
        </SafeAreaView>
        <Image
          source={require('@/assets/images/logo-sdad.png')}
          style={{ width: 120, height: 120, marginBottom: 16 }}
          resizeMode="contain"
        />

        <Text fontSize={24} fontWeight="bold" textAlign="center">{t("login.title")}</Text>
        <Text fontSize={18} fontWeight="bold" textAlign="center">{t("login.subtitle")}</Text>

        <YStack gap="$4" width={'100%'}>
          <Input
            height={50}
            width={'100%'}
            borderWidth={2}
            focusStyle={{ borderColor: '$colorFocus' }}
            placeholder={t("login.username")}
            value={username}
            onChangeText={setUsername}
            style={{ backgroundColor: 'white' }}
          />
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder={t("login.password")}
          />
        </YStack>

        {/* <Text width={'100%'} textAlign="right" onPress={onForgotPassword}>
          {t("login.forgotPassword")}
        </Text> */}

        <View style={{ width: '100%', flexDirection: 'row', gap: 10 }}>
          <Button flex={1} onPress={onRegister}>{t("login.register")}</Button>
          <Button flex={1} onPress={onLogin}>{t("login.loginButton")}</Button>
        </View>

        <View style={{ backgroundColor: '#00000025', height: 1, width: '100%' }} />
        <Button width={'100%'} onPress={() => Linking.openURL('https://www.facebook.com/mfuactivities/')}>
          {t("login.contactUs")}
        </Button>

      </View>
      <Text textAlign="center" fontSize={10} color="#666" paddingBottom={24} marginHorizontal={24}>
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

const styles = StyleSheet.create({
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});