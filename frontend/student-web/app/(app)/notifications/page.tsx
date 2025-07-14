"use client";

import { useState } from "react";
import { Button, Card, CardBody, ScrollShadow } from "@heroui/react";
import { useNotification } from "@/hooks/useNotification";
import { NotificationCard } from "./_components/NotificationCard";
import { NotificationModal } from "./_components/NotificationModal";
import type { NotificationItem } from "@/types/notification";

export default function NotificationsPage() {
  const [tab, setTab] = useState<"unread" | "read">("unread");
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    notifications,
    readNotification,
    fetchNotification,
    setNotifications,
  } = useNotification();

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
      <div className="fixed inset-0 flex items-center justify-center bg-transparent px-4">
        <Card className="w-full max-w-xl py-6 px-6 bg-black/20 backdrop-blur-md border border-white rounded-2xl shadow-lg">
          <div className="flex mb-4 p-1 bg-[#e1dedd] rounded-2xl w-full max-w-sm mx-auto">
            {["unread", "read"].map((key) => (
              <Button
                key={key}
                className={`w-1/2 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  tab === key ? "bg-black/60 text-white shadow-md" : "text-black"
                }`}
                onPress={() => setTab(key as "unread" | "read")}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Button>
            ))}
          </div>

          {filteredNotifications.length > 4 ? (
            <ScrollShadow className="max-h-[400px] w-full pr-2">
              <CardBody className="space-y-4 pt-2 px-2 pb-0">
                {filteredNotifications.map((item) => (
                  <NotificationCard
                    key={item._id}
                    item={item}
                    onClick={() => openModal(item)}
                  />
                ))}
              </CardBody>
            </ScrollShadow>
          ) : (
            <CardBody className="space-y-4 pt-2 px-2 pb-0">
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
            </CardBody>
          )}
        </Card>
      </div>

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
