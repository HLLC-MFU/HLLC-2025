'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three';
import ProfileCard from './_components/ProfileCard';
import { Scene } from './_components/Scene';
import { SceneLights } from './_components/SceneLights';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@heroui/react';
import { Eye, EyeOff, Settings, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReportModal } from '../report/page';

export default function ProfilePage() {
  const { schoolAcronym } = useProfile();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <div className="flex flex-col justify-between fixed inset-0 pt-6 pb-16 px-4 z-50">
      <div className="flex flex-col self-end gap-2 z-50">
        <Button
          className="bg-black/10 border rounded-full"
          size="lg"
          isIconOnly
          onPress={() => setIsVisible(prev => !prev)}
        >
          {isVisible
            ? <Eye color="white" />
            : <EyeOff color="white" />
          }
        </Button>
        <Button
          className="bg-black/10 border rounded-full"
          size="lg"
          isIconOnly
          onPress={() => { }}
        >
          <Settings color="white" />
        </Button>
        <Button
          className="bg-black/10 border rounded-full"
          size="lg"
          isIconOnly
          onPress={() => setIsReportOpen(true)}
        >
          <TriangleAlert color="white" />
        </Button>
      </div>

      <Canvas
        camera={{ position: [0, 0, 10], fov: 30 }}
        style={{
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          zIndex: 1,
          position: "absolute",
        }}
        onCreated={() => {
          THREE.ColorManagement.enabled = true;
        }}
      >
        {schoolAcronym ? <SceneLights /> : <ambientLight intensity={0.05} />}
        <Scene schoolAcronym={schoolAcronym} />
        <OrbitControls
          minDistance={10}
          maxDistance={15}
          minPolarAngle={Math.PI / 2.25}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Canvas>

      {isVisible &&
        <div className="px-4 pb-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto z-10">
          <ProfileCard />
        </div>
      }
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
