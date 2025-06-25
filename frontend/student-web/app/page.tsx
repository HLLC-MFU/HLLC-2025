'use client';

import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

function Scene() {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF('/models/Untitled.glb');
  const { animations } = gltf;
  const { actions } = useAnimations(animations, group);
  const scale = 1;

  // ✅ Fix materials
  useEffect(() => {
    gltf.scene.traverse(child => {
      if (
        (child as THREE.Mesh).isMesh ||
        (child as THREE.SkinnedMesh).isSkinnedMesh
      ) {
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach(mat => {
          if (mat.map) mat.map.encoding = THREE.SRGBColorSpace;
          mat.roughness = 1; // Set roughness to 1 for a matte finish
          mat.metalness = 0; // Set metalness to 0 for a non-metallic finish
          mat.depthWrite = true;
          mat.needsUpdate = true;
        });
      }
    });
  }, [gltf]);

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
  }, [gltf]);

  // ✅ Play first animation (if available)
  useEffect(() => {
    if (animations.length > 0 && actions) {
      actions[animations[0].name]?.reset().play();
    }
  }, [actions, animations]);

  return (
    <>
      <group ref={group} scale={scale}>
        <primitive object={gltf.scene} />
        {/* <primitive object={new THREE.AxesHelper(1)} /> */}
      </group>
      ✅ พื้นรับเงา
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      ;
    </>
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
        intensity={2.0}
        position={[5, 10, 35]}
        color={0xfff952}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      /> */}
      {/* 💥 Rim Light: ด้านหลังแรงๆ แบบ spotlight เลย */}
      {/* <directionalLight
        intensity={3.5}
        position={[-3, 5, -1]}
        color={0x00FF00}
        /> */}
      {/* 🔵 Fill Light: แสงเสริมด้านข้าง เพิ่มสีฟ้านุ่มๆ */}
      {/* <directionalLight
        intensity={1.0}
        position={[0, 2, -5]}
        color={0x88ccff}
      /> */}
      <directionalLight
        castShadow
        intensity={2}
        position={[5, 10, 5]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      {/* <directionalLight
        intensity={0.5}
        position={[0, 5, -4]}
        color={0xfff952}
      /> */}
    </>
  );
}

// Component สำหรับโหลดและตั้ง HDR background + environment
function HDRBackground() {
  const { scene } = useThree();

  const texture = useLoader(
    RGBELoader,
    `${process.env.NEXT_PUBLIC_API_URL}/uploads/skybackground.hdr`,
  );

  useEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    scene.background = texture; // แสดง HDR เป็น background
    scene.environment = texture; // ใช้ HDR เป็น environment map สำหรับแสงสะท้อน
  }, [scene, texture]);

  return null;
}

export default function Home() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2, 6], fov: 90 }}
      onCreated={({ gl, camera }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.outputColorSpace = THREE.SRGBColorSpace; // แก้ชื่อให้ตรง (sRGBEncoding)
        camera.lookAt(0, 3, 0);
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <HDRBackground />
      <SceneLights />
      <Scene />
      <OrbitControls
        target={[0, 3, 0]}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
        enableZoom={false}
      />
    </Canvas>
  );
}
