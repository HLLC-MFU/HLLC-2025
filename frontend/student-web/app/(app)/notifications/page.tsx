"use client";

import { useEffect, useState } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalContent, ScrollShadow, Divider } from "@heroui/react";
import { useNotification } from "@/hooks/useNotification";
import { NotificationCard } from "./_components/NotificationCard";
import { NotificationModal } from "./_components/NotificationModal";
import type { NotificationItem } from "@/types/notification";
import { Bell } from "lucide-react";

type NotificationsProps = {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPage({
  isOpen,
  onClose,
}: NotificationsProps) {
  const [tab, setTab] = useState<"unread" | "read">("unread");
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    notifications,
    readNotification,
    fetchNotification,
    setNotifications,
  } = useNotification();

  useEffect(() => {
    fetchNotification();
  }, []);

  const openModal = (item: NotificationItem) => {
    setSelectedNotification(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedNotification(null);
    setModalOpen(false);
    fetchNotification();
  };

  const filteredNotifications = notifications.filter((noti) =>
    tab === "unread" ? !noti.isRead : noti.isRead
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isDismissable={false}
        placement="top-center"
        classNames={{
          header: "border-b-[1px]",
          closeButton: "bg-transparent m-1"
        }}
        className="m-12 mt-32"
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
      >
        <ModalContent className="w-full backdrop-blur-md border border-white">
          <ModalHeader className="p-3">
            Notifications
          </ModalHeader>

          {filteredNotifications.length === 0 ? (
            <ModalBody className="flex justify-center items-center p-12">
              <Bell size={32} color="#d1d5db" />
              <p className="font-semibold">No notifications yet</p>
              <p className="text-center text-[14px] text-default-500">We'll notify you when something arrives</p>
            </ModalBody>
          ) : (
            <>
              <div className="flex mb-4 p-1 bg-[#e1dedd] rounded-2xl w-full max-w-sm mx-auto">
                {["unread", "read"].map((key) => (
                  <Button
                    key={key}
                    className={`w-1/2 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${tab === key ? "bg-black/60 text-white shadow-md" : "text-black"
                      }`}
                    onPress={() => setTab(key as "unread" | "read")}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Button>
                ))}
              </div>

              {filteredNotifications.length > 4 ? (
                <ScrollShadow className="max-h-[400px] w-full pr-2">
                  <ModalBody className="space-y-4 pt-2 px-2 pb-0">
                    {filteredNotifications.map((item) => (
                      <NotificationCard
                        key={item._id}
                        item={item}
                        onClick={() => openModal(item)}
                      />
                    ))}
                  </ModalBody>
                </ScrollShadow>
              ) : (
                <ModalBody className="space-y-4 pt-2 px-2 pb-0">
                  {filteredNotifications.length === 0 ? (
                    <p className="text-center text-white/70 text-sm py-4">No Notifications</p>
                  ) : (
                    filteredNotifications.map((item) => (
                      <NotificationCard
                        key={item._id}
                        item={item}
                        onClick={() => openModal(item)}
                      />
                    ))
                  )}
                </ModalBody>
              )}
            </>
          )}

        </ModalContent>
      </Modal >

      <NotificationModal
        isOpen={modalOpen}
        onClose={closeModal}
        data={selectedNotification ?? undefined}
        markAsRead={readNotification}
        setNotifications={setNotifications}
      />
    </>
  );
}
