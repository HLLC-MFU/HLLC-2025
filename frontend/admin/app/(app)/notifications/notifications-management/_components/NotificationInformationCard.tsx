'use client';
import {
  Card,
  Avatar,
  CardFooter,
  CardHeader,
  CardBody,
  AvatarGroup,
} from '@heroui/react';
import { Notification } from '@/types/notification';
import { useState } from 'react';
import NotificationModal from './NotificationDetailModal';
import { useNotification } from '@/hooks/useNotification';

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

interface NotificationCardprop {
  notification: Notification[];
}

const statusColorMap: Record<string, { bg: string; text: string }> = {
  global: { bg: 'bg-green-100', text: 'text-green-800' },
  school: { bg: 'bg-blue-100', text: 'text-blue-800' },
  major: { bg: 'bg-gray-100', text: 'text-gray-800' },
  individual: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

export default function NotificationCard({ notification }: NotificationCardprop) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const { deleteNotification } = useNotification()
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  };


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-8 w-full ">
      {(Array.isArray(notification) ? notification : []).map((item, id) => (
        <Card key={item._id} className=" rounded-2xl overflow-hidden shadow-md">
          <CardHeader className="flex flex-col items-start ">
            <div className=" py-2 ">
              <h4 className="font-bold text-lg break-words py-0.5">
                {capitalize(item.title.en)}
              </h4>
              <p className="text-sm break-words">
                {capitalize(item.subtitle.en)}
              </p>
            </div>

            <div className=" flex gap-3 ">
              {/* เอาไว้สำหรับการหา ตัวของ scope ใน object อีกที่  */}

              {typeof item.scope === 'string' ? (
                <span
                  className={`px-2 pt-1 rounded-md font-medium text-sm ${statusColorMap[item.scope]?.bg} ${statusColorMap[item.scope]?.text}`}
                >
                  {capitalize(item.scope)}
                </span>
              ) : (
                item.scope.map((target, index) => (
                  <span
                    key={index}
                    className={`px-2 pt-1 rounded-md font-medium text-sm ${statusColorMap[target.type]?.bg} ${statusColorMap[target.type]?.text}`}
                  >
                    {capitalize(target.type)}
                  </span>
                ))
              )}
              {item.redirectButton?.url && (
                <span className=" font-normal text-sm bg-red-100 px-2 pt-1 rounded-md text-red-800 ">
                  Link
                </span>
              )}
            </div>
          </CardHeader>

          <CardBody>
            <p className="text-sm break-words">{capitalize(item.body.en)}</p>
          </CardBody>

          <CardFooter>
            <div className="w-full flex justify-between items-center">
              <AvatarGroup size="sm" isBordered max={3}>
                <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                <Avatar src="https://i.pravatar.cc/150?u=a04258a2462d826712d" />
                <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                <Avatar src="https://i.pravatar.cc/150?u=a04258114e29026302d" />
                <Avatar src="https://i.pravatar.cc/150?u=a04258114e29026702d" />
                <Avatar src="https://i.pravatar.cc/150?u=a04258114e29026708c" />
              </AvatarGroup>
              <div className="flex items-center">
                <p onClick={() => deleteNotification(item._id)} className="mx-2 text-sm hover:text-red-800  cursor-pointer"> Delete </p>
                <p onClick={() => handleOpenModal(item)} className="mx-2 font-medium hover:text-blue-800 cursor-pointer transition" > View </p>
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}

      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        notification={selectedNotification}
      />
    </div>
  );
}
