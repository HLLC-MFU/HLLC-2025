import { Suspense } from 'react';
import CoinHuntingPageInner from './CoinHuntingPageInner';
import SkeletonCoinHuntingPage from './SkeletonCoinHuntingPage';

export default function CoinHuntingPage() {
  return (
    <Suspense fallback={<SkeletonCoinHuntingPage />}>
      <CoinHuntingPageInner />
    </Suspense>
  );
}
