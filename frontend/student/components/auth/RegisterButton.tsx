'use client';

import React, { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Button, AlertDialog, YStack, Text, XStack } from 'tamagui';
import { useTranslation } from 'react-i18next';

export default function RegisterButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    setOpen(false); // close modal
    await WebBrowser.openBrowserAsync('https://hllc.mfu.ac.th/register');
  };

  return (
    <>
      <Button flex={1} onPress={() => setOpen(true)}>
        {t('login.register')}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content bordered elevate>
            <YStack space="$3">
              <AlertDialog.Title>{t('confirm.title') || 'Confirm'}</AlertDialog.Title>
              <AlertDialog.Description>
                {t('confirm.register') || 'Do you want to open the registration page?'}
              </AlertDialog.Description>

              <XStack justifyContent="flex-end" space>
                <AlertDialog.Cancel asChild>
                  <Button theme="active" onPress={() => setOpen(false)}>
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                </AlertDialog.Cancel>

                <AlertDialog.Action asChild>
                  <Button theme="red" onPress={handleConfirm}>
                    {t('common.confirm') || 'Yes'}
                  </Button>
                </AlertDialog.Action>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  );
}
