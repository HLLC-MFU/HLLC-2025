import React, { useRef } from 'react';

import * as THREE from 'three'
import { GLView } from 'expo-gl';
import { Canvas, useFrame } from '@react-three/fiber/native'

import { Text, StyleSheet, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassButton } from "@/components/ui/GlassButton";
import { useRouter } from "expo-router";
import { GraduationCap, University } from 'lucide-react-native';
import useProfile from "@/hooks/useProfile";
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user } = useProfile();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    // <LinearGradient
    //   colors={['#4c669f', '#4c669f']}
    //   start={[0, 0.4]}
    //   end={[0, 0.6]}
    //   style={{ flex: 1 }}
    // >
    <SafeAreaView style={styles.container}>
      <View style={{ width: 80 }}>
        <GlassButton onPress={useRouter().back}>
          <Text style={{ color: 'white' }}>Back</Text>
        </GlassButton>
      </View>

      <GLView
        style={{ flex: 1 }}
        onContextCreate={(gl) => {}}
      >
        <Canvas camera={{ position: [-2, 2.5, 5], fov: 30 }}>
          <mesh ref={meshRef}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="hotpink" />
          </mesh>
        </Canvas>
      </GLView>

      <View style={styles.information}>
        <View style={styles.field}>
          <Text style={styles.name}>{user?.data[0].name.first} {user?.data[0].name.last ?? ''}</Text>
          <Text style={styles.userName}>{user?.data[0].username}</Text>
        </View>

        <View style={styles.field}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
            <University color="dodgerblue" />
            <Text style={styles.topic}>SCHOOL</Text>
          </View>
          <Text style={styles.school}>{user?.data[0].metadata.major.school.name.en}</Text>
        </View>

        <View style={styles.field}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
            <GraduationCap color="dodgerblue" />
            <Text style={styles.topic}>MAJOR</Text>
          </View>
          <Text style={styles.school}>{user?.data[0].metadata.major.name.en}</Text>
        </View>
      </View>
    </SafeAreaView>
    // </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
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
    fontSize: 22,
    fontWeight: '600',

  },
  userName: {
    color: '#D0D0D0',
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
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
});