'use client';

import { Canvas } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

import ProfileCard from './_components/ProfileCard';

function Scene() {
  const group = useRef<THREE.Group>(null);
  const fbx = useFBX('/models/test500.fbx');
  const scale = 0.01;

  useEffect(() => {
    fbx.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh || (child as any).isSkinnedMesh) {
        const mesh = child as THREE.Mesh;

        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
              mat.transparent = false;
              mat.roughness = 1;
              mat.metalness = 0;
              mat.depthWrite = true;
              mat.needsUpdate = true;
            }
          });
        }
      }
    });
  }, [fbx]);

  useEffect(() => {
    if (!group.current) return;

    const box = new THREE.Box3();
    const tempBox = new THREE.Box3();

    group.current.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        mesh.geometry?.computeBoundingBox?.();
        if (mesh.geometry?.boundingBox) {
          tempBox
            .copy(mesh.geometry.boundingBox)
            .applyMatrix4(mesh.matrixWorld);
          box.union(tempBox);
        }
      }
    });

    const center = new THREE.Vector3();

    box.getCenter(center);
    const yMin = box.min.y;

    group.current.position.set(
      -center.x * scale,
      -yMin * scale - 3,
      -center.z * scale,
    );
  }, [fbx]);

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
      <directionalLight
        castShadow
        color={0xffffff}
        intensity={2.5}
        position={[5, 10, 5]}
      />
    </>
  );
}

export default function ProfilePage() {
  return (
    <div className="fixed inset-0">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 30 }}
        style={{
          width: '100%',
          height: 300,
          position: 'absolute',
          top: 80,
          left: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
        onCreated={() => {
          THREE.ColorManagement.enabled = true;
        }}
      >
        <SceneLights />
        <Scene />
      </Canvas>

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="pt-[380px] px-4 pb-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
          <ProfileCard />
        </div>
      </div>
    </div>
  );
}
