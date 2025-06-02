// app/qr.tsx
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';

import QRCodeGenerator from '@/components/qrcode/generator';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import useProfile from '@/hooks/useProfile';
import { ImageBackground } from 'expo-image';
import { BlurView } from 'expo-blur';

export default function QRCodePage() {
  const { user, getProfile } = useProfile();
  const router = useRouter();

  useEffect(() => {
    getProfile();
  }, []);

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <MotiView
        style={{
          backgroundColor: 'white',
          padding: 36,
          borderRadius: 24,
          alignItems: 'center',
          gap: 24,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
            {user?.data[0].name.first}  {user?.data[0].name.last}
          </Text>
          <Text>Student ID: {user?.data[0].username}</Text>
        </View>

        <QRCodeGenerator username={user?.data[0].username ?? 'defaultUsername'} />

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingVertical: 10,
            paddingHorizontal: 20,
            backgroundColor: '#2563EB',
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
}
