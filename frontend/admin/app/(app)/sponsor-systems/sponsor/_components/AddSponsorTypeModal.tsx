import React, { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';
import { SponsorType } from '@/types/sponsors';

export type AddSponsorTypeProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddType: (type: { name: string; priority: number }) => void;
  sponsorsType: SponsorType[];
};

export default function AddSponsorTypeModal({
  isOpen,
  onClose,
  onAddType,
  sponsorsType,
}: AddSponsorTypeProps) {
  const typeNameRef = useRef<HTMLInputElement>(null);
  const [priority, setPriority] = useState<number>(0);
  const [disabledKeys, setDisableKeys] = useState<string[]>([]);

  useEffect(() => {
    const key = sponsorsType
      .filter((type) => type.priority !== undefined)
      .map((type) => (type.priority - 1).toString());
    setDisableKeys(key);
  }, [sponsorsType]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!typeNameRef.current?.value) return;

    onAddType({
      name: typeNameRef.current.value,
      priority: priority,
    });
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
            <Select
              isRequired
              label="Priority"
              placeholder="Select priority"
              onChange={(e) => setPriority(Number(e.target.value) + 1)}
              disabledKeys={disabledKeys}
            >
              {Array.from({ length: 20 }).map((_, index) => (
                <SelectItem key={index}>{(index + 1).toString()}</SelectItem>
              ))}
            </Select>
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
