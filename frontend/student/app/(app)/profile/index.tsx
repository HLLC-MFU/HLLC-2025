import React from 'react';
import { Asset } from 'expo-asset';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer, loadAsync } from 'expo-three';
import * as THREE from 'three';

export default function ProfileScreen() {
  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    const renderer = new Renderer({ gl }) as THREE.WebGLRenderer;
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      90,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    // แสง
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 1, 1).normalize();
    scene.add(light);

    // โหลดโมเดลจาก assetsr
    const modelAsset = Asset.fromModule(
      require('../../../assets/models/Untitled.glb'),
    );
    await modelAsset.downloadAsync();

    const glb = await loadAsync(modelAsset);
    const model = glb.scene;
    scene.add(model);

    const render = () => {
      requestAnimationFrame(render);

      model.rotation.y += 0.01;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    render();

    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ color: '#444' });
    // const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);
  };

  return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
}
