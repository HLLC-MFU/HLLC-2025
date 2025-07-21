'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlignJustify, Coins, Flower, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/glass-button';
import { useSseStore } from '@/stores/useSseStore';
import { useAppearances } from '@/hooks/useAppearances';

const baseImageUrl = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);

  const subFabs = [
    {
      key: 'step',
      icon: <Footprints color={"white"} />,
      label: 'MILESDREAM',
      onPress: () => setIsStepModalOpen(!isStepModalOpen),
    },
    {
      key: 'coin',
      icon: <Coins color={"white"} />,
      label: 'MISSIONS: BLOOMPOSSIBLE',
      onPress: () => router.replace('/community/coin-hunting'),
    },
    {
      key: 'lamduanflowers',
      icon: <Flower color={"white"} />,
      label: 'LAMDUAN FLOWER',
      onPress: () => router.replace('/lamduan-flowers'),
    },
  ];

  const { assets } = useAppearances();
  const progress = useSseStore(state => state.progress);

  const router = useRouter();

  const steps = 9000;
  // const progressLoading = false;
  const deviceMismatch = false;

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 80,
      scale: 0
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
        ease: 'easeOut',
      },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: 80,
      scale: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
        ease: 'easeIn',
      },
    }),
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="relative flex flex-col max-h-full w-full bg-cover bg-center bg-no-repeat text-white pt-4 md:pt-10 pb-28">
      <div
        className={`fixed inset-0 transition-all duration-500 ${isMenuOpen && 'backdrop-blur bg-black/20'}`}
        onClick={() => setIsMenuOpen(false)}
      />

      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-3">
          <GlassButton
            iconOnly
            onClick={toggleMenu}
            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-black/10"
          >
            {assets && assets.menu ? (
              <Image
                alt="Menu"
                src={`${baseImageUrl}/uploads/${assets.menu}`}
                width={20}
                height={20}
              />
            ) : (
              <AlignJustify className="text-white" size={20} />
            )}
          </GlassButton>
          <AnimatePresence>
            {subFabs.map((sub, index) => (
              <motion.div
                key={sub.key}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                animate={isMenuOpen ? "visible" : "exit"}
                className="flex items-center justify-center gap-2 px-4 bg-white/30 
                  w-60 h-14 sm:h-16 md:h-20 rounded-full border border-white/40 
                  shadow-lg text-[14px] text-center tracking-[1px] font-semibold 
                  z-50 transition-all hover:bg-white/10 active:scale-95"
                onClick={sub.onPress}
              >
                {sub.icon}
                {sub.label}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

    </div >
  );
}
