"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Button,
  Image,
} from "@heroui/react";
import type { NotificationItem } from "@/types/notification";
import { useEffect } from "react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: NotificationItem;
  markAsRead?: (id: string) => void;
  setNotifications?: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

export function NotificationModal({
  isOpen,
  onClose,
  data,
  markAsRead,
  setNotifications,
}: NotificationModalProps) {
  useEffect(() => {
    if (isOpen && data?._id && data.isRead === false) {
      markAsRead?.(data._id);
      setNotifications?.((prev) =>
        prev.map((noti) =>
          noti._id === data._id ? { ...noti, isRead: true } : noti
        )
      );
    }
  }, [isOpen, data?._id]);

  if (!data) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      size="lg"
      className="z-[100] bg-black/20 backdrop-blur-md border border-white rounded-2xl shadow-lg"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-white">
          <span className="text-lg font-semibold">{data.title?.en || "No Topics"}</span>
          <span className="text-xs text-white/50">
            {data.createdAt
              ? new Date(data.createdAt).toLocaleString("th-TH", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "Time not specified"}
          </span>
        </ModalHeader>

        <ModalBody className="text-white space-y-4">
          {data.image && (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${data.image}`}
              alt="Notification"
              className="w-full rounded-xl object-cover"
            />
          )}

          <div className="space-y-2 text-sm">
            <p>
              <strong>Topic :</strong> {data.title?.en}
            </p>
            <p>
              <strong>Subtitle :</strong> {data.subtitle?.en}
            </p>
            {data.body?.en && (
              <p>
                <strong>Description :</strong> {data.body.en}
              </p>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
