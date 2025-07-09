'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export default function FbxViewer() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 50 }}
      style={{ width: '100vw', height: '100vh' }}
      onCreated={({ gl }) => {
        gl.outputEncoding = THREE.sRGBEncoding;
      }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight castShadow intensity={1.5} position={[5, 10, 5]} />
      <Scene />
      <OrbitControls />
    </Canvas>
  );
}
