import React, { useEffect, useRef, Suspense } from 'react';

import * as THREE from 'three'
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Asset } from 'expo-asset';
import { Canvas } from '@react-three/fiber/native';
import { GLTFLoader } from 'three-stdlib';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { useGLTF } from '@react-three/drei/native';

import { Text, StyleSheet, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassButton } from "@/components/ui/GlassButton";
import useProfile from "@/hooks/useProfile";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, University } from 'lucide-react-native';

global.Buffer = Buffer;

export default function ProfileScreen() {
  const { user } = useProfile();


  // const {nodes, materials} = useGLTF(require('../../../assets/models/argo.glb'));
  // console.log('nodes', nodes);
  // console.log('materials', materials);

  // const asset = Asset.fromURI(FileSystem.documentDirectory + 'argo.glb');
  // asset.downloadAsync();
  // console.log("asset", asset);

  // const fileUri = asset.localUri || asset.uri;
  // console.log('fileUri', fileUri);

  // FileSystem.readAsStringAsync(fileUri, {
  //   encoding: FileSystem.EncodingType.Base64,
  // }).then(binaryString => {
  //   console.log('binaryString length', binaryString);
  // });


  function Model() {
    const ref = useRef<THREE.Group>(null);

    useEffect(() => {
      const loadModel = async () => {
        try {
          const asset = Asset.fromURI(FileSystem.documentDirectory + 'argo.glb');
          // const asset = Asset.fromModule(require('@/assets/models/argo.glb'));
          await asset.downloadAsync();
          console.log("asset", asset);

          const fileUri = asset.localUri || asset.uri;
          console.log('fileUri', fileUri);

          const binaryString = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('binaryString length', binaryString.length);

          const buffer = Buffer.from(binaryString, 'base64');
          console.log('buffer length', buffer.length);

          const arrayBuffer = buffer.buffer.slice(
            buffer.byteOffset,
            buffer.byteOffset + buffer.byteLength
          );
          console.log('arrayBuffer byteLength', arrayBuffer.byteLength);

          const loader = new GLTFLoader();
          console.log('Parsing...');

          loader.parse(
            arrayBuffer,
            '',
            (gltf) => {
              console.log('gltf loaded:', gltf);
              if (ref.current) {
                ref.current.add(gltf.scene);
              }
            },
            (error) => {
              console.error('Failed to parse GLB:', error);
            }
          );
        } catch (err) {
          console.error('Error loading model:', err);
        }
      };

      loadModel();
    }, []);

    return <group ref={ref} />;
  }

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

      {/* <Canvas camera={{ position: [-2, 2.5, 5], fov: 30 }}>
        <Suspense>
          <Model/>
        </Suspense>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="white" />
        </mesh>
      </Canvas> */}

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