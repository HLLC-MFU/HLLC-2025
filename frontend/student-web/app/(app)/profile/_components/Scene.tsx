'use client';
import { useGLTF } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

type SceneProps = {
  schoolAcronym: string | null
}

export function Scene({ schoolAcronym }: SceneProps ) {
  const group = useRef<THREE.Group>(null);
  const glb = useGLTF(`models/${schoolAcronym ?? 'LAW'}.glb`);
  const scale = 1;

  useEffect(() => {
    glb.scene.traverse((child: THREE.Object3D) => {
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
  }, [glb]);

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
      -center.z * scale
    );
  }, [glb]);

  return (
    <group ref={group} scale={scale}>
      <primitive object={glb.scene} />
      <primitive object={new THREE.AxesHelper(1)} />
    </group>
  );
}
