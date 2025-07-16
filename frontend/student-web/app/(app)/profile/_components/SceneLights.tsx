'use client';
export function SceneLights() {
  return (
    <>
      <ambientLight intensity={2.0} />
      <directionalLight
        castShadow
        color={0xffffff}
        intensity={2.5}
        position={[5, 10, 5]} />
    </>
  );
}
