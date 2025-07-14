import React from 'react';
import { Text, Pressable } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPressable() {
    const handleForgotPassword = async () => {
        await WebBrowser.openBrowserAsync('https://hllc.mfu.ac.th/forgot-password');
    };
    const { t } = useTranslation();

    return (
        <Pressable onPress={handleForgotPassword}>
            <Text style={{ textAlign: 'right', color: '#00000080', marginBottom: 10 }}>
                {t("login.forgotPassword")}
            </Text>
        </Pressable>
    );
}
