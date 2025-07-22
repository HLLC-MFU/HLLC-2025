import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Platform, PanResponder } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GLView } from "expo-gl";
import { router } from "expo-router";
import { BlurView } from 'expo-blur';
import { GlassButton } from "@/components/ui/GlassButton";
import useProfile from "@/hooks/useProfile";
import { GraduationCap, University, Eye, EyeOff, Settings, TriangleAlert } from "lucide-react-native";
import { Paragraph, Spinner, YStack } from "tamagui";
import { ReportModal } from "@/components/report/ReportModal";
import { onContextCreate } from "@/components/profile/Scene";
import { useAppearance } from "@/hooks/useAppearance";
import AssetImage from "@/components/global/AssetImage";
import { useLanguage } from "@/context/LanguageContext";
import { Group } from "three";

const imageUrl = `${process.env.EXPO_PUBLIC_API_URL}/uploads/`

export default function ProfileScreen() {
  const { user } = useProfile();
  const { assets } = useAppearance();

  const [isViewing, setIsViewing] = useState(true);
  const [loading, setLoading] = useState(true)
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { language } = useLanguage();

  // const characterSceneRef = useRef<Group | null>(null);
  // const baseSceneRef = useRef<Group | null>(null);
  const modelRef = useRef<Group | null>(null);

  useEffect(() => {
    Animated.timing(
      fadeAnim,
      {
        toValue: isViewing ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }
    ).start();
  }, [isViewing]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      if (modelRef.current) {
        modelRef.current.rotation.y += gesture.dx * 0.001;
        // characterSceneRef.current.rotation.y += gesture.dx * 0.001;
        // baseSceneRef.current.rotation.y += gesture.dx * 0.001;

        modelRef.current.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, modelRef.current.rotation.x)
        );
        // characterSceneRef.current.rotation.x = Math.max(
        //   -Math.PI / 2,
        //   Math.min(Math.PI / 2, characterSceneRef.current.rotation.x)
        // );
        // baseSceneRef.current.rotation.x = Math.max(
        //   -Math.PI / 2,
        //   Math.min(Math.PI / 2, baseSceneRef.current.rotation.x)
        // );
      }
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <GlassButton onPress={router.back}>
          <Text style={{ color: 'white' }}>Back</Text>
        </GlassButton>
        <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <GlassButton iconOnly onPress={() => setIsViewing(!isViewing)}>
            {isViewing ? (
              assets.visible ? <AssetImage uri={imageUrl + assets.visible} /> : <Eye color='white' />
            ) : (
              assets.invisible ? <AssetImage uri={imageUrl + assets.invisible} /> : <EyeOff color='white' />
            )}
          </GlassButton>
          <GlassButton iconOnly onPress={() => router.replace('/(app)/settings')}>
            {assets.settings ? <AssetImage uri={imageUrl + assets.settings} /> : <Settings color='white' />}
          </GlassButton>
          <GlassButton iconOnly onPress={() => setReportModalVisible(true)}>
            {assets.report ? <AssetImage uri={imageUrl + assets.report} /> : <TriangleAlert color='white' />}
          </GlassButton>
        </View>
      </View>

      {loading &&
        <YStack position="absolute" height={"90%"} width={"100%"} justifyContent="center" alignItems="center">
          <Spinner size="large" />
          <Paragraph marginTop="$2" color="white">Loading character...</Paragraph>
        </YStack>
      }

      {/* 3D Model */}
      <View {...panResponder.panHandlers} style={{ position: 'absolute', width: '100%', height: '100%', }}>
        <GLView
          style={{ position: 'absolute', width: '100%', height: '100%', }}
          onContextCreate={(gl) =>
            // onContextCreate(gl, user, setLoading, characterSceneRef, baseSceneRef)
            onContextCreate(gl, user, setLoading, modelRef)
          }
        />
      </View>

      <Animated.View style={{ justifyContent: 'flex-end', position: 'absolute', width: '100%', height: '100%', paddingBottom: Platform.OS === 'android' ? '20%' : '10%', opacity: fadeAnim }}>
        <BlurView
          style={[
            styles.information,
            Platform.OS === 'android' && { backgroundColor: 'rgba(0,0,0,0.85)' }
          ]}
        >
          {/* Full name and Username */}
          <View style={styles.field}>
            <Text style={styles.name}>{user?.data[0].name.first} {user?.data[0].name.last ?? '-'}</Text>
            <Text style={styles.userName}>{user?.data[0].username}</Text>
          </View>
          {/* School */}
          <View style={styles.field}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
              <University color="dodgerblue" />
              <Text style={styles.topic}>SCHOOL</Text>
            </View>
            <Text style={styles.school}>
              {user?.data?.[0]?.metadata?.major?.school?.name[language] ?? '-'}
            </Text>
          </View>
          {/* Major */}
          <View style={styles.field}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
              <GraduationCap color="dodgerblue" />
              <Text style={styles.topic}>MAJOR</Text>
            </View>
            <Text style={styles.school}>
              {user?.data?.[0]?.metadata?.major?.name[language] ?? '-'}
            </Text>
          </View>
        </BlurView>
      </Animated.View>

      {/* Modal สำหรับรายงานปัญหา (ใช้ ReportModal component) */}
      <ReportModal
        visible={isReportModalVisible}
        onClose={() => setReportModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
    paddingHorizontal: 16,
  },
  topic: {
    color: 'dodgerblue',
    fontSize: 18,
    fontWeight: '600',
  },
  field: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  userName: {
    color: '#eeeeeeee',
    fontSize: 16,
    fontWeight: '500',
  },
  school: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  information: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 30,
    marginHorizontal: 'auto',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.6)',
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  textArea: {
    backgroundColor: '#333',
    color: 'white',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  cancelButton: {
    color: '#aaa',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sendButton: {
    color: 'dodgerblue',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
