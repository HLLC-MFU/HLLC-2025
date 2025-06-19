import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { useEffect } from 'react';

import QRCodeGenerator from '@/components/qrcode/generator';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import useProfile from '@/hooks/useProfile';
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
      <BlurView
        intensity={40}
        tint="light"
        style={{
          borderRadius: 20,
          padding: 32,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.2)",
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
            {user?.data[0].name.first}  {user?.data[0].name.last}
          </Text>
          <Text style={{color: '#fff', marginBottom: 16}}>Student ID: {user?.data[0].username}</Text>
        </View>

        <QRCodeGenerator username={user?.data[0].username ?? 'defaultUsername'} />
      </BlurView>
    </SafeAreaView>
  );
}
