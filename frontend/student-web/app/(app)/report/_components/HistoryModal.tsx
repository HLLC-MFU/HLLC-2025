'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from '@heroui/react';

export function HistoryModal({
  isOpen,
  onClose,
  reportHistory,
  reporttypes,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  reportHistory: any[];
  reporttypes: any[];
  loading: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent className="bg-black/10 backdrop-blur-md border border-white rounded-2xl shadow-lg">
        <ModalHeader className="text-white">Report History</ModalHeader>
        <ModalBody>
          {loading ? (
            <Spinner className="mx-auto" />
          ) : reportHistory.length === 0 ? (
            <p className="text-white/70 text-center">No reports submitted yet.</p>
          ) : (
            <ul className="space-y-2">
              {reportHistory.map((item) => (
                <li key={item._id} className="border-b border-white/20 pb-2">
                  <p className="text-white font-semibold">
                    {reporttypes.find((t) => t.id === item.category._id)?.name.en ||
                      item.category.name.en}
                  </p>
                  <p className="text-white/80">{item.message}</p>
                  <p className="text-xs text-white/50">
                    Status: {item.status} | Sent at: {new Date(item.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose} className="text-white">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
