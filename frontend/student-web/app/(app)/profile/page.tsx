'use client';

import { Canvas } from '@react-three/fiber';
import { Center, useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import ProfileCard from './_components/ProfileCard';

function Scene() {
  const group = useRef<THREE.Group>(null);
  const fbx = useFBX('/models/test500.fbx');
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
          mat.roughness = 1;
          mat.metalness = 0;
          mat.specular = new THREE.Color(0x000000);
          mat.depthWrite = true;
          mat.needsUpdate = true;
        });
      }
    });
  }, [fbx]);

  // ✅ Center model
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

  // ❌ ไม่เล่นแอนิเมชัน
  // useEffect(() => {
  //   if (animations.length > 0 && actions) {
  //     actions[animations[0].name]?.reset().play();
  //   }
  // }, [actions, animations]);

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
      <ambientLight intensity={2.0} />
    </>
  );
}

export default function ProfilePage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh',  }}>
      {/* 3D Model */}
      <Canvas
        camera={{ position: [0, 20, 50], fov: 10 }}
        style={{
          width: '100%',
          height: 300,
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
        onCreated={({ gl }) => {
          gl.outputEncoding = THREE.SRGBColorSpace;
        }}
      >
        <SceneLights />
        <Scene />
      </Canvas>

      {/* Profile Card */}
      <div style={{ paddingTop: 250, position: 'relative', zIndex: 2 }}>
        <ProfileCard />
      </div>
    </div>
  );
}
