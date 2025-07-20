'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three';
import ProfileCard from './_components/ProfileCard';
import { Scene } from './_components/Scene';
import { SceneLights } from './_components/SceneLights';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@heroui/react';
import { Eye, EyeOff, Settings, TriangleAlert } from 'lucide-react';
import { ReportModal } from '../report/page';
import { useAppearances } from '@/hooks/useAppearances';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { schoolAcronym } = useProfile();
  const { assets } = useAppearances();

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <div className="flex flex-col justify-between h-full pt-4">
      <div className="flex justify-between">
        <Button
          onPress={() => router.replace('/')}
          className="bg-black/10 border rounded-full text-white"
        >
          Back
        </Button>
        <div className="flex flex-col self-end gap-2 z-50">
          <Button
            className="bg-black/10 border rounded-full"
            size="lg"
            isIconOnly
            onPress={() => setIsVisible(prev => !prev)}
          >
            {isVisible ? (
              (assets && assets.visible) ? (
                <Image
                  alt="Visible"
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.visible}`}
                  width={20}
                  height={20}
                />
              ) : (
                <Eye color="white" />
              )
            ) : (
              (assets && assets.invisible) ? (
                <Image
                  alt="Invisible"
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.invisible}`}
                  width={20}
                  height={20}
                />
              ) : (
                <EyeOff color="white" />
              )
            )}
          </Button>
          <Button
            className="bg-black/10 border rounded-full"
            size="lg"
            isIconOnly
            onPress={() => { router.replace('/settings') }}
          >
            {(assets && assets.settings) ? (
              <Image
                alt="Settings"
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.settings}`}
                width={20}
                height={20}
              />
            ) : (
              <Settings color="white" />
            )}
          </Button>
          <Button
            className="bg-black/10 border rounded-full"
            size="lg"
            isIconOnly
            onPress={() => setIsReportOpen(true)}
          >
            {(assets && assets.settings) ? (
              <Image
                alt="Report"
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.report}`}
                width={20}
                height={20}
              />
            ) : (
              <TriangleAlert color="white" />
            )}
          </Button>
        </div>
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
          <ProfileCard />
      }

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
