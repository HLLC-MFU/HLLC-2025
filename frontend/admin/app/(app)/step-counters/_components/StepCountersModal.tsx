import { Button } from '@heroui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from '@heroui/react';
import { Footprints } from 'lucide-react';

type SettingModalProps = {
  isOpen: boolean;
  onSettingStepTarget: () => void;
};

export default function StepContersModal({
  isOpen,
  onSettingStepTarget,
}: SettingModalProps) {
  return (
    <>
      <Modal
        backdrop="opaque"
        isOpen={isOpen}
        onOpenChange={onSettingStepTarget}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Add Steps Goal
              </ModalHeader>
              <ModalBody>
                <Input
                  type="number"
                  endContent={
                    <Footprints className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                  }
                  label="StepsTargets"
                  placeholder="Enter Target Steps"
                  variant="bordered"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Update
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}