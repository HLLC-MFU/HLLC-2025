import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';
import { Notification } from '@/types/notification';

interface NotificationProp {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export default function NotificationModal({
  isOpen,
  onClose,
  notification,
}: NotificationProp) {
  if (!notification) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="opaque"
    >
      <ModalContent className='max-w-xl w-full'>
        <>
          <ModalHeader className="flex flex-col gap-1">
            Model Information
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h1 className="text-md font-semibold text-gray-700">
                    Title (En)
                  </h1>
                  <p className="text-sm text-gray-900">
                    {notification.title.en}
                  </p>
                </div>
                <div>
                  <h1 className="text-md font-semibold text-gray-700">
                    Title (Th)
                  </h1>
                  <p className="text-sm text-gray-900">
                    {notification.title.th}
                  </p>
                </div>
              </div>

              {/* Subtitle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h1 className="text-md font-semibold text-gray-700">
                    Subtitle (En)
                  </h1>
                  <p className="text-sm text-gray-900">
                    {notification.subtitle.en}
                  </p>
                </div>
                <div>
                  <h1 className="text-md font-semibold text-gray-700">
                    Subtitle (Th)
                  </h1>
                  <p className="text-sm text-gray-900">
                    {notification.subtitle.th}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h1 className="text-md font-semibold text-gray-700">
                    Description (En)
                  </h1>
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {notification.body.en}
                  </p>
                </div>
                <div>
                  <h1 className="text-md font-semibold text-gray-700">
                    Description (Th)
                  </h1>
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {notification.body.th}
                  </p>
                </div>
              </div>

              {notification.redirectButton?.url && (
                <>
                  <h1 className="text-base font-semibold text-gray-800 mb-2">
                    Redirect Button
                  </h1>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h1 className="text-sm font-semibold text-gray-700">
                        Label (En)
                      </h1>
                      <p className="text-sm text-gray-900 whitespace-pre-line">
                        {notification.redirectButton.label.en}
                      </p>
                    </div>
                    <div>
                      <h1 className="text-sm font-semibold text-gray-700">
                        Label (Th)
                      </h1>
                      <p className="text-sm text-gray-900 whitespace-pre-line">
                        {notification.redirectButton.label.th}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <h1 className="text-sm font-semibold text-gray-700">
                        URL
                      </h1>
                      <p className="text-sm text-blue-700 break-words underline">
                        {notification.redirectButton.url}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Optional Image */}
              {notification.image && (
                <img
                  src={`http://localhost:8080/api/uploads/${notification.image}`}
                  alt="Notification"
                  className="w-full h-48 object-cover rounded-lg mt-4"
                />
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
