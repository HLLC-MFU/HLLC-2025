'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, useFBX } from '@react-three/drei';
import * as THREE from 'three';

function Scene() {
  const fbx = useFBX('/models/1.fbx');

  // Center model using bounding box
  const box = new THREE.Box3().setFromObject(fbx);
  const center = new THREE.Vector3();

  box.getCenter(center);
  fbx.position.sub(center); // move to origin

  // Fix materials and visibility
  fbx.traverse(child => {
    if (child.isMesh || child.isSkinnedMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Overwrite material to make sure it's visible
      child.material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.5,
      });
    }
  });

  return (
    <>
      <primitive object={fbx} scale={0.01} />
      <primitive object={new THREE.AxesHelper(2)} />
    </>
  );
}

export default function Home() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 60 }}
      style={{ height: '100vh', background: '#888' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight castShadow intensity={1.5} position={[5, 10, 5]} />
      <OrbitControls />
      <Scene />
    </Canvas>
  );
}
