'use client';

import { Canvas, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  useFBX,
  useAnimations,
  Environment,
} from '@react-three/drei';
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

    console.log(center);

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
      <ambientLight intensity={1.6} />
      {/* ☀️ Key Light: ด้านหน้า */}
      <directionalLight
        castShadow
        intensity={2.5}
        position={[5, 10, 5]}
        color={0x00ff00}
      />
      {/* 💥 Rim Light: ด้านหลังแรงๆ แบบ spotlight เลย */}
      <directionalLight
        intensity={3.5}
        position={[-3, 5, -1]}
        color={0xeb8934}
      />
      {/* 🔵 Fill Light: แสงเสริมด้านข้าง เพิ่มสีฟ้านุ่มๆ */}
      {/* <directionalLight
        intensity={1.0}
        position={[0, 2, -5]}
        color={0x88ccff}
      /> */}
    </>
  );
}

function BackgroundImage({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  const { scene } = useThree();

  useEffect(() => {
    scene.background = texture;
  }, [scene, texture]);

  return null;
}

export default function Home() {
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 90 }}
      onCreated={({ gl, camera, scene }) => {
        gl.outputEncoding = THREE.SRGBColorSpace;
        camera.lookAt(0, 3, 0);
        // Scene background
        scene.background = new THREE.Color('#292a2b');
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',

        // เซ็ทด้วยสไตล์ CSS แบบ default ภาพสีตรง
        // backgroundImage: `url(${process.env.NEXT_PUBLIC_API_URL}/uploads/cartoon-forest.jpg)`,
        // backgroundSize: 'cover',
      }}
    >
      เป็น Scene background เหมือนอันแรก แต่แยก function
      {/* <BackgroundImage url={`${process.env.NEXT_PUBLIC_API_URL}/uploads/forestBackground.jpg`} /> */}
      ใช้ Environment แทนพื้นหลังแบบภาพ ภาพจะหมุนวนรอบโมเดล
      {/* <Environment files={`${process.env.NEXT_PUBLIC_API_URL}/uploads/cartoon-forest.jpg`} background /> */}
      <SceneLights />
      <Scene />
      <OrbitControls
        target={[0, 3, 0]}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </Canvas>
  );
}
