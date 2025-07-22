"use client";

import { useEffect, useState, useMemo, ComponentType } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalContent,
  Button,
  Image
} from "@heroui/react";
import * as LucideIcons from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import type { NotificationItem } from "@/types/notification";

type NotificationsProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NotificationsPage({ isOpen, onClose }: NotificationsProps) {
  const {
    notifications = [],
    readNotification,
    markAllAsRead,
    fetchNotification,
    setNotifications,
  } = useNotification();

  const [tab, setTab] = useState<"unread" | "read">("unread");
  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    fetchNotification();
  }, []);

  const filtered = useMemo(() => {
    return notifications.filter((n) =>
      tab === "unread" ? !n.isRead : n.isRead
    );
  }, [notifications, tab]);

  const handleCardClick = async (noti: NotificationItem) => {
    if (!noti.isRead) {
      await readNotification(noti._id);
    }
    setSelected(noti);
  };

  const handleMarkAll = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const allLucideIcons = useMemo(() => {
    return Object.keys(LucideIcons).map(iconName => ({
      value: iconName,
      label: iconName,
      icon: LucideIcons[iconName as keyof typeof LucideIcons] as ComponentType<LucideIcons.LucideProps>,
    }));
  }, []);

  const renderIcon = (iconName?: string, size = 20) => {
    if (!iconName) return;
    const iconObj = allLucideIcons.find(icon => icon.value === iconName);
    if (!iconObj) return;
    const IconComponent = iconObj.icon;
    return <IconComponent size={size} />;
  };

  function formatTimeAgo(dateString: string) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return date.toLocaleDateString("th-TH", {
      year: "2-digit",
      month: "short",
      day: "2-digit",
    });
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isDismissable={false}
        placement="top-center"
        className="m-12 mt-32"
      >
        <ModalContent className="w-full max-w-md border border-white/20 backdrop-blur-md bg-white rounded-xl shadow-xl">
          <ModalHeader className="flex justify-between items-center border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
          </ModalHeader>

          <div className="flex justify-center mt-3 mb-2">
            {["unread", "read"].map((type) => (
              <button
                key={type}
                onClick={() => setTab(type as "unread" | "read")}
                className={
                  "px-4 py-1 rounded-full mx-1 text-sm font-semibold transition-all " +
                  (tab === type
                    ? "bg-blue-500 text-white shadow"
                    : "bg-gray-100 text-gray-600")
                }
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <ModalBody className="max-h-[420px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <LucideIcons.Bell size={36} className="mx-auto mb-2" />
                <p className="font-semibold text-base">No notifications</p>
                <p className="text-sm text-gray-400">We'll notify you when something arrives.</p>
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n._id}
                  className="relative bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3 cursor-pointer hover:shadow transition"
                  onClick={() => handleCardClick(n)}
                >
                  {n.createdAt && (
                    <span className="absolute top-2 right-3 text-[11px] text-gray-400">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="pt-1">{renderIcon(n.icon)}</div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-gray-900">{n.title?.en || "Untitled"}</p>
                      <p className="text-sm text-gray-600">{n.subtitle?.en || "No detail"}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-2" />
                  <div className="flex gap-3">
                    <p className="text-sm text-gray-800 flex-1">{n.body?.en}</p>
                    {n.image && (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${n.image}`}
                        alt="noti-img"
                        className="w-16 h-16 rounded-md object-cover bg-gray-200"
                      />
                    )}
                  </div>
                  {!n.isRead && (
                    <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                  )}
                </div>
              ))
            )}
          </ModalBody>

          {tab === "unread" && filtered.length > 0 && (
            <div className="border-t px-4 py-2">
              <Button
                size="sm"
                className="w-full font-semibold text-blue-600 hover:bg-blue-50"
                onPress={handleMarkAll}
                isDisabled={markingAll}
              >
                {markingAll ? "Marking..." : "Mark all as read"}
              </Button>
            </div>
          )}
        </ModalContent>
      </Modal>

      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          backdrop="blur"
          placement="center"
        >
          <ModalContent className="max-w-md w-full bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                {renderIcon(selected.icon)}
                <p className="font-semibold text-lg">{selected.title?.en}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">{selected.subtitle?.en}</p>
            <div className="border-t border-gray-200 mb-4" />
            <p className="text-sm text-gray-800 whitespace-pre-line">{selected.body?.en}</p>
            {selected.image && (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${selected.image}`}
                alt="detail-img"
                className="w-32 h-32 mt-4 rounded-lg object-cover mx-auto"
              />
            )}
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
