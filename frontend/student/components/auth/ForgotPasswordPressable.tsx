import React from 'react';
import { Text, Pressable, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPressable() {
  const { t } = useTranslation();

  const handleForgotPassword = () => {
    Alert.alert(
      t('confirm.title') || 'Confirm',
      t('confirm.forgotPassword') || 'Do you want to open the password recovery page?',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('common.confirm') || 'Yes',
          onPress: async () => {
            await WebBrowser.openBrowserAsync('https://hllc.mfu.ac.th/forgot-password');
          },
        },
      ]
    );
  };

  return (
    <Pressable onPress={handleForgotPassword}>
      <Text style={{ textAlign: 'right', color: '#00000080', marginBottom: 10 }}>
        {t('login.forgotPassword')}
      </Text>
    </Pressable>
  );
}
