import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { Button } from 'tamagui';
import { useTranslation } from 'react-i18next';

export default function RegisterButton() {
  const { t } = useTranslation();

  const openRegisterPage = () => {
    WebBrowser.openBrowserAsync('https://hllc.mfu.ac.th/register');
  };

  const handleRegister = () => {
    Alert.alert(
      t('register.permission.title') || 'Confirm',
      t('register.permission.message') || 'Do you want to open the registration page?',
      [
        {
          text: t('register.permission.Cancle') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('register.permission.confirm') || 'Yes',
          onPress: openRegisterPage,
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Button flex={1} onPress={handleRegister}>
      {t('login.register')}
    </Button>
  );
}
