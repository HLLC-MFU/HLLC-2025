import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "tamagui";
import { GLView } from "expo-gl";
import { Renderer, loadAsync } from "expo-three";
import { Asset } from "expo-asset";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ExpoWebGLRenderingContext } from "expo-gl";
import { Scene, PerspectiveCamera, Object3D, Color, AmbientLight, DirectionalLight, Box3, Vector3 } from "three";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Profile</Text>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
      />
    </SafeAreaView>
  );
}

interface OnContextCreateParams {
    gl: ExpoWebGLRenderingContext;
}
async function onContextCreate(gl: ExpoWebGLRenderingContext): Promise<void> {
  const scene = new Scene();
  scene.background = new Color(0xdddddd);

  const camera = new PerspectiveCamera(
    75,
    gl.drawingBufferWidth / gl.drawingBufferHeight,
    0.01,
    1000
  );
  camera.position.z = 3;

  const renderer = new Renderer({ gl });
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

  // ✅ Lighting
  scene.add(new AmbientLight(0xffffff, 0.6));
  const dirLight = new DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // ✅ Load .glb
  const modelAsset = Asset.fromModule(require('../../assets/models/argo.glb'));
  await modelAsset.downloadAsync();

  const loader = new GLTFLoader();
  const glb = await new Promise((resolve, reject) => {
    loader.load(
      modelAsset.localUri || modelAsset.uri,
      resolve,
      undefined,
      reject
    );
  });

  const model = glb.scene;
  model.scale.set(0.1, 0.1, 0.1);

  // ✅ Recenter model
  const box = new Box3().setFromObject(model);
  const center = new Vector3();
  box.getCenter(center);
  model.position.sub(center); // Shift the model so it’s centered

  scene.add(model);

  const render = (): void => {
    requestAnimationFrame(render);
    model.rotation.y += 0.01;
    renderer.render(scene, camera);
    gl.endFrameEXP();
  };

  render();
}

