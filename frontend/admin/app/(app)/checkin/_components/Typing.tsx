import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from '@heroui/react';
import { IdCard } from 'lucide-react';

interface TypingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Typing({ isOpen, onClose }: TypingProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent className="mx-7">
        <>
          <ModalHeader className="flex flex-col gap-1">
            Add New Student ID
          </ModalHeader>
          <ModalBody>
            <Input
              endContent={
                <IdCard className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
              }
              label="Student ID"
              placeholder="Enter your Student ID"
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" onPress={onClose}>
              Add Student
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
