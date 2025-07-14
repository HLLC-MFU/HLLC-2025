'use client';

import { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  NumberInput,
} from '@heroui/react';
import { StepAchievement } from '@/types/step-counters';

type SettingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  achievement: StepAchievement | null;
  onUpdate: (steps: number) => void;
};

export default function StepContersModal({
  isOpen,
  onClose,
  achievement,
  onUpdate,
}: SettingModalProps) {
  const [stepsValue, setStepsValue] = useState<number>(0);

  useEffect(() => {
    if (achievement) {
      setStepsValue(achievement.achievement);
    }
  }, [achievement]);

  return (
    <>
      <Modal
        isDismissable={false}
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Update Goal
          </ModalHeader>
          <ModalBody>
            <NumberInput
              value={stepsValue}
              onValueChange={(value) => setStepsValue(value)}
              label="Goal"
              placeholder="Enter Target Steps"
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => {
                onUpdate(stepsValue);
                onClose();
              }}
            >
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
