'use client';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import { Box3, LinearSRGBColorSpace, Material, Mesh, MeshStandardMaterial, Object3D, SRGBColorSpace, Vector3 } from 'three';

type SceneProps = {
  schoolAcronym: string | null
}

export function Scene({ schoolAcronym }: SceneProps) {
  const character = useGLTF(`${process.env.NEXT_PUBLIC_API_URL}/uploads/models/${(schoolAcronym ?? "DENT").toUpperCase()}.glb`);
  const base = useGLTF(`${process.env.NEXT_PUBLIC_API_URL}/uploads/models/BASE.glb`);
  const { actions } = useAnimations(character.animations, character.scene)

  // Play Animation
  useEffect(() => {
    if (character.animations.length > 0 && actions && schoolAcronym) {
      if (schoolAcronym.toUpperCase() === "LAW") {
        actions[character.animations[character.animations.length - 5].name]?.reset().play();
      } else if (schoolAcronym.toUpperCase() === "MED") {
        actions[character.animations[0].name]?.reset().play();
      } else {
        actions[character.animations[character.animations.length - 1].name]?.reset().play();
      }
    }
  }, [actions, character.animations]);

  // Fix Texture Materials
  character.scene.traverse((child: Object3D) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;

      if (mesh.material) {
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((mat: Material) => {
          if (mat instanceof MeshStandardMaterial) {
            if (mat.map) mat.map.colorSpace = LinearSRGBColorSpace;
            mat.transparent = false;
            mat.metalness = 0;
            mat.roughness = 0.5;
            mat.depthWrite = true;
            mat.needsUpdate = true;
          }
        });
      }
    }
  });

  base.scene.traverse((child: Object3D) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;

      if (mesh.material) {
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((mat: Material) => {
          if (mat instanceof MeshStandardMaterial) {
            if (mat.map) mat.map.colorSpace = SRGBColorSpace;
            mat.transparent = false;
            mat.metalness = 0;
            mat.roughness = 0.5;
            mat.depthWrite = true;
            mat.needsUpdate = true;
          }
        });
      }
    }
  });

  return (
    <group>
      <primitive object={character.scene} position={[0, 0, 0]} scale={0.4} />
      <primitive object={base.scene} position={[-0.35, -5.84, 0.2]} scale={0.6} />
      {/* <primitive object={new AxesHelper(1)} /> */}
    </group>
  );
}
