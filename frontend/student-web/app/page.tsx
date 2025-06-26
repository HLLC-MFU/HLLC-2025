'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

function Scene() {
  const group = useRef<THREE.Group>(null);
  const fbx = useFBX('/models/test500.fbx');
  const { animations } = fbx;
  const { actions } = useAnimations(animations, group);
  const scale = 0.01;

  // ✅ Fix materials
  useEffect(() => {
    fbx.traverse(child => {
      if (child.isMesh || child.isSkinnedMesh) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach(mat => {
          if (mat.map) mat.map.encoding = THREE.SRGBColorSpace;
          mat.transparent = false;
          // mat.opacity = 1;
          mat.roughness = 1; // Set roughness to 1 for a matte finish
          mat.metalness = 0; // Set metalness to 0 for a non-metallic finish
          mat.specular = new THREE.Color(0x000000); // Set specular to black
          mat.depthWrite = true;
          mat.needsUpdate = true;
        });
      }
    });
  }, [fbx]);

  // ✅ Center based on all meshes
  useEffect(() => {
    if (!group.current) return;

    const box = new THREE.Box3();
    const tempBox = new THREE.Box3();

    group.current.traverse(child => {
      if (child.isMesh) {
        child.geometry?.computeBoundingBox?.();
        tempBox
          .copy(child.geometry.boundingBox!)
          .applyMatrix4(child.matrixWorld);
        box.union(tempBox);
      }
    });

    const center = new THREE.Vector3();

    box.getCenter(center);
    const yMin = box.min.y;

    group.current.position.set(
      -center.x * scale,
      -yMin * scale,
      -center.z * scale,
    );
  }, [fbx]);

  // ✅ Play first animation (if available)
  useEffect(() => {
    if (animations.length > 0 && actions) {
      actions[animations[0].name]?.reset().play();
    }
  }, [actions, animations]);

  return (
    <group ref={group} scale={scale}>
      <primitive object={fbx} />
      <primitive object={new THREE.AxesHelper(1)} />
    </group>
  );
}

function SceneLights() {
  return (
    <>
      🔆 Ambient: พื้นฐาน ไม่ต้องเยอะมาก ถ้าอยากเห็น rim เด่น
      <ambientLight intensity={2.0} />

      {/* ☀️ Key Light: ด้านหน้า */}
      {/* <directionalLight
        castShadow
        intensity={2.5}
        position={[5, 10, 5]}
        color={0xffffff}
      /> */}

      {/* 💥 Rim Light: ด้านหลังแรงๆ แบบ spotlight เลย */}
      {/* <directionalLight
        intensity={3.5}
        color={0x00FF00}
        position={[-3, 5, -6]}
      /> */}

      {/* 🔵 Fill Light: แสงเสริมด้านข้าง เพิ่มสีฟ้านุ่มๆ */}
      {/* <directionalLight
        intensity={1.0}
        color={0x88ccff}
        position={[0, 2, -5]}
      /> */}
    </>
  );
}


export default function Home() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 50 }}
      style={{ width: '100vw', height: '100vh' }}
      onCreated={({ gl }) => {
        gl.outputEncoding = THREE.SRGBColorSpace;
      }}
    >
      <SceneLights />
      <Scene />
      <OrbitControls />
    </Canvas>
  );
}
