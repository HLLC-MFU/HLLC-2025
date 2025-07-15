'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import ProfileCard from './_components/ProfileCard';
import { Scene } from './_components/Scene';
import { SceneLights } from './_components/SceneLights';
import { useProfile } from '@/hooks/useProfile';
import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import GlassButton from '@/components/ui/glass-button';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading, error, fetchUser, schoolAcronym } = useProfile();
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>{error}</div>;
  // if (!user) return <div>No user</div>;

  return (
    <div className="fixed inset-0">
      <div className="absolute top-8 right-6 z-20 flex gap-2">
        <GlassButton iconOnly onClick={() => router.push('/report')}>
          <ShieldAlert className="text-white" size={20} />
        </GlassButton>
      </div>

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
        {schoolAcronym ? <SceneLights /> : ''}
        <Scene schoolAcronym={schoolAcronym}/>
      </Canvas>

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="pt-[380px] px-4 pb-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
          <ProfileCard />
        </div>
      </div>
    </div>
  );
}
