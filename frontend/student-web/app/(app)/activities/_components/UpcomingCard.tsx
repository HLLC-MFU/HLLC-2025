'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { formatDateTime } from '@/utils/dateFormat';
import { Activities } from '@/types/activities';
import { Card, CardHeader, CardBody, CardFooter, Chip } from '@heroui/react';

export default function UpcomingCard({ activity }: { activity: Activities }) {
    const router = useRouter();

    if (!activity) return null;

    const handleViewDetails = () => {
        router.push(`/activities/${activity._id}`);
    };

    return (
        <div onClick={handleViewDetails} className='hover:cursor-pointer border-white/20 border-2 rounded-xl overflow-hidden'>
            <Card className="rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-cover bg-center"
                style={{
                    backgroundImage: `url(${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity.photo?.bannerPhoto})`,
                }}>
                <CardHeader className="flex items-center justify-between w-full">
                    <Chip color="default" variant="flat">
                        <p className="flex items-center text-xs font-semibold">
                            <Clock size={14} className="mr-1" /> {formatDateTime(activity.metadata?.startAt)}
                        </p>

                    </Chip>
                    <Chip color="default" variant="flat" className="flex flex-row items-center">
                        <p className='flex items-center font-semibold text-xs'>
                            <MapPin size={14} className="mr-1" /> {activity.location?.en}
                        </p>
                    </Chip>
                </CardHeader>
                {/* <CardBody>
                    <p className="font-semibold text-xl">{activity.name?.en}</p>
                </CardBody> */}
                <CardFooter className="flex flex-row items-center justify-end">
                    <Chip color="default" variant="flat" className="flex flex-row items-center">
                        <p className="text-xs font-semibold flex items-center">Upcoming Event<ArrowUpRight size={16} /></p>
                    </Chip>
                </CardFooter>
            </Card>
        </div>
    );
}
