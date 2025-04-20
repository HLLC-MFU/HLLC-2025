"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { ReactNode } from "react";

interface BlurModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  showDefaultFooter?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  isDismissable?: boolean;
}

export default function BlurModal({
  isOpen,
  onClose,
  title = "Modal Title",
  children,
  footer,
  showDefaultFooter = true,
  className,
  size = "2xl",
  isDismissable = true,
}: BlurModalProps) {
  return (
    <Modal 
      backdrop="blur" 
      isOpen={isOpen} 
      onClose={onClose}
      size={size}
      isDismissable={isDismissable}
      classNames={{
        base: className,
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-lg font-semibold">
              {title}
            </ModalHeader>

            <ModalBody className="text-sm text-gray-700 dark:text-gray-300 space-y-3">
              {children}
            </ModalBody>

            {footer ? (
              <ModalFooter>{footer}</ModalFooter>
            ) : showDefaultFooter ? (
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            ) : null}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
