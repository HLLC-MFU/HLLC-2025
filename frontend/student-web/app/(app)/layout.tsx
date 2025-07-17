'use client';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

import BottomNav from '@/components/bottom-nav';
import lobby from '@/public/lobby_6.jpeg';
import ProgressBar from '@/components/ui/progressBar';
import SSEListener from '@/components/SSEListener';
import { useAppearances } from '@/hooks/useAppearances';
import { useProfile } from '@/hooks/useProfile';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { fetchUser } = useProfile();
  const { assets } = useAppearances();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const shouldBlur = pathname !== '/';

  const hideProgressSummary =
    pathname === '/community' || pathname.startsWith('/community/coin-hunting');

  return (
    <>
      <SSEListener />
      <div className="relative h-dvh w-full overflow-hidden pb-24">
        {assets && assets.background ? (
          assets.background.endsWith('.mp4') ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-screen h-screen object-cover z-0"
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.background}`}
            />
          ) : (
            <Image
              fill
              priority
              alt="Background"
              className="absolute inset-0 object-cover z-0"
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.background}`}
            />
          )
        ) : (
          <Image
            fill
            priority
            alt="Background"
            className="absolute inset-0 object-cover z-0"
            src={lobby}
          />
        )}
        <div
          className="absolute inset-0 z-10 pointer-events-none transition-all duration-500"
          style={{
            backdropFilter: `blur(${shouldBlur ? 8 : 0}px)`,
            WebkitBackdropFilter: `blur(${shouldBlur ? 8 : 0}px)`,
            backgroundColor: shouldBlur ? 'rgba(0,0,0,0.1)' : 'transparent',
            opacity: shouldBlur ? 1 : 0,
          }}
        />

        <div className="relative z-20 flex h-full flex-col text-foreground">
          <div className="fixed top-0 left-0 right-0 z-40">
            {!hideProgressSummary && (
              <ProgressBar
                avatarUrl={(assets && assets.profile)
                  ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${assets.profile}`
                  : ""
                }
                onClickAvatar={() => router.push('/profile')}
              />
            )}
          </div>

          <main
            className={`relative flex-1 overflow-y-auto mt-24 md:mt-32 px-4 md:px-8 transition-opacity duration-500`}
          >
            {children}
          </main>

          <div className="fixed bottom-0 left-0 right-0 z-50 mx-4 pb-4 h-20">
            <BottomNav />
          </div>
        </div>
      </div>
    </>
  );
}
