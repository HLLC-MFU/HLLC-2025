import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Button } from 'tamagui';
import { useTranslation } from 'react-i18next';

export default function RegisterButton() {
    const { t } = useTranslation();
    const handleRegister = async () => {
        const result = await WebBrowser.openBrowserAsync('https://hllc.mfu.ac.th/register');
    };

    return (
        <Button flex={1} onPress={handleRegister} >
            {t("login.register")}
        </Button>
    );
}
