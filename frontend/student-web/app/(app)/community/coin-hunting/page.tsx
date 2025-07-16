import { Suspense } from 'react';
import CoinHuntingPageInner from './CoinHuntingPageInner';

export default function CoinHuntingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CoinHuntingPageInner />
    </Suspense>
  );
}
