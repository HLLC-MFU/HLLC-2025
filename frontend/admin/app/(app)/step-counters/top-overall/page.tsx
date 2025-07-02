'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeft, Footprints } from 'lucide-react';
import TopThreeCards from '../_components/StepCountersCard';
import StepcontersUserTable from '../_components/StepcountersUserTable';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';

export default function TopOverallPage() {
    // MOCK DATA – ต้องแทนที่ด้วยการ fetch จริงในโปรเจกต์
    const users = Array.from({ length: 25 }, (_, i) => ({
        rank: i + 1,
        id: '6631503008',
        name: 'WASAN NACHAI',
        school: 'ADT',
        major: 'SE',
        steps: 15000,
    }));

    const topThree = users.slice(0, 3);

    const router = useRouter();

    return (
        <div>
            <PageHeader
                title="StepConters"
                description="View The Steps And LeaderBoard"
                icon={<Footprints />}
            />

            <div className="mt-4 space-y-6">
                         <Button
							startContent={<ArrowLeft />}
							variant="flat"
							onPress={() => router.back()}
						>
							Back
						</Button>

                <TopThreeCards data={topThree} variant="topThree" />
                <StepcontersUserTable stepCounters={users} />
            </div>
        </div>
    );
}
