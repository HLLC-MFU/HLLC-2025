import React from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

export type AddSponsorTypeProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddType: (type: { name: string }) => void;
};

export default function AddSponsorTypeModal({
  isOpen,
  onClose,
  onAddType,
}: AddSponsorTypeProps) {
  const typeNameRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!typeNameRef.current?.value) return;

    onAddType({ name: typeNameRef.current.value });
  };

  return (
    <Modal
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalContent>
        <Form className="w-full" onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            Add new sponsor type
          </ModalHeader>
          <ModalBody className="w-full">
            <Input
              isRequired
              type="text"
              label="Type Name"
              placeholder="Enter Type Name"
              ref={typeNameRef}
            />
          </ModalBody>
          <ModalFooter className="w-full">
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Confirm
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
} 