'use client';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

type SceneProps = {
  schoolAcronym: string | null
}

export function Scene({ schoolAcronym }: SceneProps) {
  const character = useGLTF(`${process.env.NEXT_PUBLIC_API_URL}/uploads/models/${(schoolAcronym ?? "DENT").toUpperCase()}.glb`);
  const base = useGLTF(`${process.env.NEXT_PUBLIC_API_URL}/uploads/models/BASE.glb`);
  const { actions } = useAnimations(character.animations, character.scene)

  // Play Animation
  useEffect(() => {
    if (character.animations.length > 0 && actions) {
      actions[character.animations[2].name]?.reset().play();
    }
  }, [actions, character.animations]);

  // Fix Texture Materials
  useEffect(() => {
    character.scene.traverse((child: THREE.Object3D) => {
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
              mat.depthWrite = true;
              mat.needsUpdate = true;
            }
          });
        }
      }
    });
  }, [character]);

  useEffect(() => {
    base.scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh || (child as any).isSkinnedMesh) {
        const mesh = child as THREE.Mesh;

        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              if (mat.map) mat.map.colorSpace = THREE .SRGBColorSpace;
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
  }, [base]);

  // Center Model
  // useEffect(() => {
  //   if (!group.current) return;

  //   const box = new THREE.Box3();
  //   const tempBox = new THREE.Box3();

  //   group.current.traverse((child: THREE.Object3D) => {
  //     if ((child as THREE.Mesh).isMesh) {
  //       const mesh = child as THREE.Mesh;

  //       mesh.geometry?.computeBoundingBox?.();
  //       if (mesh.geometry?.boundingBox) {
  //         tempBox
  //           .copy(mesh.geometry.boundingBox)
  //           .applyMatrix4(mesh.matrixWorld);
  //         box.union(tempBox);
  //       }
  //     }
  //   });

  //   const center = new THREE.Vector3();

  //   box.getCenter(center);
  //   const yMin = box.min.y;

  //   group.current.position.set(
  //     -center.x * scale,
  //     -yMin * scale - 2,
  //     -center.z * scale
  //   );
  // }, [character]);

  return (
    <group>
      <primitive object={character.scene} position={[0, 0, 0]} scale={0.4} />
      <primitive object={base.scene} position={[-0.35, -5.84, 0.2]} scale={0.6} />
      {/* <primitive object={new THREE.AxesHelper(1)} /> */}
    </group>
  );
}
