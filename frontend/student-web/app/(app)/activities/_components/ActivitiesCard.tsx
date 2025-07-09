import { Card, CardBody, Chip } from '@heroui/react';
import { MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { formatDateTime } from '@/utils/dateFormat';
import { Activities } from '@/types/activities';

type ActivitiesCardProps = {
  activity: Activities;
};

export default function ActivitiesCard({ activity }: ActivitiesCardProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/activities/${activity._id}`);
  };

  return (
    <div
      className="hover:cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleViewDetails}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleViewDetails();
        }
      }}
    >
      <Card
        isHoverable
        className="min-h-full relative overflow-hidden border-white/20 border-2"
      >
        <img
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover"
          src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity?.photo?.bannerPhoto}`}
        />
        <div className="relative z-10">
          <CardBody className="gap-2 rounded-md bg-white/5 backdrop-blur flex">
            <div className="flex justify-between items-center w-full">
              <Card
                className="w-12 h-12 text-large items-center justify-center flex-shrink-0 mr-2"
                radius="md"
              >
                <img
                  alt="Banner"
                  className="absolute inset-0 w-full h-full object-cover"
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${activity?.photo?.bannerPhoto}`}
                />
              </Card>
              <div className="flex flex-col items-start min-w-0 text-start ml-1 w-full">
                <div className="flex justify-between items-center w-full itme-center">
                  <p className="flex text-md font-semibold truncate w-full items-center">
                    {activity.location.en}
                  </p>
                  <Chip color="default" variant="flat">
                    <div className="flex items-center">
                      <span className="text-xs truncate">
                        {activity.metadata.isOpen
                          ? 'Ready for Checkin'
                          : 'Not Yet Open'}
                      </span>
                    </div>
                  </Chip>
                </div>
                <p className="flex text-md font-semibold truncate w-full items-center">
                  <MapPin size={16} /> {activity.name.en}
                </p>
                <p className="flex text-small truncate w-full items-center">
                  <Clock size={15} />{' '}
                  {formatDateTime(activity.metadata.startAt)}
                </p>
              </div>
            </div>
          </CardBody>
        </div>
      </Card>
    </div>
  );
}
