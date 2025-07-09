import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GLView } from "expo-gl";
import ExpoTHREE, { Renderer } from "expo-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ExpoWebGLRenderingContext } from "expo-gl";
import {
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Box3,
  Vector3,
  AnimationMixer,
  Clock,
  Mesh,
  MeshPhysicalMaterial,
  Material
} from "three";
import { GlassButton } from "@/components/ui/GlassButton";
import { router } from "expo-router";
import { GraduationCap, University, Eye, EyeOff } from "lucide-react-native";
import useProfile from "@/hooks/useProfile";
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system';
import { Paragraph, Spinner, YStack } from "tamagui";

if (__DEV__) {
  const originalLog = console.log;
  console.log = (msg, ...args) => {
    if (
      typeof msg === 'string' && msg.includes("gl.pixelStorei() doesn't support this parameter")) {
      return;
    }
    originalLog(msg, ...args);
  };
  const originalConsoleError = console.error;
  console.error = (msg, ...args) => {
    if (typeof msg === 'string' && msg.includes("THREE.GLTFLoader: Couldn't load texture")) {
      return;
    }
    originalConsoleError(msg, ...args);
  };
}

export default function ProfileScreen() {
  const { user } = useProfile();
  const [isViewing, setIsViewing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [loading, setLoading] = useState(true)

  async function onContextCreate(gl: ExpoWebGLRenderingContext) {
    const scene = new Scene();

    // Camera
    const camera = new PerspectiveCamera(
      90,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.01,
      1000
    );
    camera.position.z = 3;

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Light
    scene.add(new AmbientLight(0xffffff, 1));
    const dirLight = new DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    const textureFile = user?.data[0].metadata.major.school.model;
    const glb = textureFile.model;

    const loader = new GLTFLoader();
    if (!glb) return;
    loader.setResourcePath(glb);
    const glbModel = await loader.loadAsync(`${process.env.EXPO_PUBLIC_API_URL}/uploads/${glb}`);

    const model = glbModel.scene;
    model.scale.set(0.5, 0.5, 0.5);

    // Textures
    const meshList: Mesh[] = [];

    glbModel.scene.traverse(async (child) => {
      if (child instanceof Mesh) {
        meshList.push(child);
      }
    });

    for (const mesh of meshList) {
      const childName = (mesh.material as Material).name;
      const assetPath = `${process.env.EXPO_PUBLIC_API_URL}/uploads/${textureFile[childName]}`;
      const localPath = `${FileSystem.cacheDirectory}${textureFile[childName]}`;

      if (assetPath) {
        try {
          const { uri } = await FileSystem.downloadAsync(assetPath, localPath);
          const texture = await ExpoTHREE.loadAsync({ uri });

          texture.flipY = false;
          texture.needsUpdate = true;

          if (texture) {
            mesh.material = new MeshPhysicalMaterial({ map: texture });
          }
        } catch (err) {
          console.error('Texture failed to load');
        }
      }
    };

    // Animations
    const animation = glbModel.animations;
    const mixer = new AnimationMixer(model);

    if (animation.length > 0) {
      const action = mixer.clipAction(animation[2]);
      action.play();
    }

    const box = new Box3().setFromObject(model);
    const center = new Vector3();
    box.getCenter(center);
    model.position.sub(center);

    const clock = new Clock();

    scene.add(model);
    setLoading(false);

    const render = (): void => {
      requestAnimationFrame(render);

      const delta = clock.getDelta();
      mixer.update(delta);

      if (scene && camera) {
        renderer.render(scene, camera);
      }
      gl.endFrameEXP();
    };

    render();
  }

  useEffect(() => {
    Animated.timing(
      fadeAnim,
      {
        toValue: isViewing ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }
    ).start();
  }, [isViewing]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <GlassButton onPress={router.back}>
          <Text style={{ color: 'white' }}>Back</Text>
        </GlassButton>

        <GlassButton iconOnly>
          {isViewing ? (
            <Eye onPress={() => setIsViewing(false)} color='white' />
          ) : (
            <EyeOff onPress={() => setIsViewing(true)} color='white' />
          )}
        </GlassButton>
      </View>

      {loading &&
        <YStack position="absolute" height={"90%"} width={"100%"} justifyContent="center" alignItems="center">
          <Spinner size="large" />
          <Paragraph marginTop="$2" color="white">Loading character...</Paragraph>
        </YStack>
      }

      <GLView
        style={styles.model}
        onContextCreate={onContextCreate}
      />

      <Animated.View style={{ opacity: fadeAnim }}>
        <BlurView style={styles.information}>
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
        </BlurView>
      </Animated.View>
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
    zIndex: 10,
    paddingHorizontal: 16,
  },
  model: {
    flex: 1,
    bottom: 120,
    // backgroundColor: 'white',
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
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    bottom: 140,
    gap: 20,
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
});
