import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Button } from "@heroui/react";
import { useState } from "react";

interface AddTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddType: (typeName: string) => void;
}

export default function AddTypeModal({ isOpen, onClose, onAddType }: AddTypeModalProps) {
  const [typeName, setTypeName] = useState("");

  const handleConfirm = () => {
    if (typeName.trim()) {
      onAddType(typeName.trim());
      setTypeName("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Add new type</ModalHeader>
        <ModalBody>
          <Input
            label="Type Name"
            placeholder="Enter Type Name"
            value={typeName}
            onValueChange={setTypeName}
            isRequired
          />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleConfirm}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}