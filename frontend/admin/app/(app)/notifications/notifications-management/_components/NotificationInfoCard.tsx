'use client';
import { Card, CardFooter, CardHeader, CardBody, Button } from '@heroui/react';
import { useState } from 'react';
import { Link, Eye, Trash2 } from 'lucide-react';

import NotificationModal from './NotificationDetailModal';

import { Notification } from '@/types/notification';
import { useNotification } from '@/hooks/useNotification';

interface NotificationCardprop {
  notifications: Notification[];
}

const statusColorMap: Record<string, { bg: string; text: string }> = {
  global: { bg: 'bg-green-100', text: 'text-green-800' },
  school: { bg: 'bg-blue-100', text: 'text-blue-800' },
  major: { bg: 'bg-gray-100', text: 'text-gray-800' },
  individual: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
};

export default function InformationCard({ notifications }: NotificationCardprop) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { deleteNotification } = useNotification();
  
  const handleOpenModal = (notification: Notification) => {
    setNotification(notification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNotification(null);
  };

  return (
    <div className="w-full mt-7 justify-center items-center ">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-8 w-full ">
        {(Array.isArray(notifications) ? notifications : []).map((item, id) => (
          <Card
            key={item._id}
            className=" rounded-2xl overflow-hidden shadow-md"
          >
            <CardHeader className="flex flex-col items-start ">
              <div className=" py-2 ">
                <h4 className="font-bold text-lg break-words py-0.5">
                  {item.title.en}
                </h4>
                <p className="text-sm break-words">
                  {item.subtitle.en}
                </p>
              </div>

              <div className=" flex gap-3 ">

                {typeof item.scope === 'string' ? (
                  <span
                    className={`px-2 pt-1 rounded-md font-medium text-sm ${statusColorMap[item.scope]?.bg} ${statusColorMap[item.scope]?.text}`}
                  >
                    {item.scope}
                  </span>
                ) : (
                  item.scope.map((target, index) => (
                    <span
                      key={index}
                      className={`px-2 pt-1 rounded-md font-medium text-sm ${statusColorMap[target.type]?.bg} ${statusColorMap[target.type]?.text}`}
                    >
                      {target.type}
                    </span>
                  ))
                )}
                {item.redirectButton?.url && (
                  <span className="flex bg-red-100 px-2 py-1 rounded-md text-red-800 justify-center items-center">
                    <Link className="w-4 h-4" />
                  </span>
                )}
              </div>
            </CardHeader>

            <CardBody>
              <p className="text-sm break-words text-wrap">
                {item.body.en}
              </p>
            </CardBody>

            <CardFooter>
              <div className="w-full flex justify-end">
                <Button
                  isIconOnly
                  color="danger"
                  size="sm"
                  variant="light"
                  onPress={() => deleteNotification(item._id)}
                >
                  <Trash2 className="w-5 h-auto" />
                </Button>
                <Button
                  isIconOnly
                  className="mx-2"
                  color="primary"
                  size="sm"
                  variant="light"
                  onPress={() => handleOpenModal(item)}
                >
                  <Eye className="w-5 h-auto" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}

        <NotificationModal
          isOpen={isModalOpen}
          notification={notification}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}
