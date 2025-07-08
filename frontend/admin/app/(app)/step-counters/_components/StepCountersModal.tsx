'use client';

import { useState, useEffect } from 'react';
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
import { useStepAchievement } from '@/hooks/useStepAchiever';

type SettingModalProps = {
  isOpen: boolean;
  onSettingStepTarget: () => void;
};

export default function StepContersModal({
  isOpen,
  onSettingStepTarget,
}: SettingModalProps) {
  const { achievement, updateAchievement, loading } = useStepAchievement();

  const [inputValue, setInputValue] = useState<string>('');

  // เมื่อ modal เปิด ให้โหลดค่าเริ่มต้นเข้า input
  useEffect(() => {
    if (achievement) {
      setInputValue(achievement.achievement.toString());
    }
  }, [achievement]);

  const handleUpdate = async () => {
    const parsedValue = parseInt(inputValue);
    if (isNaN(parsedValue)) return;

    console.log('🚀 กำลังส่งค่าไปอัปเดต step goal:', parsedValue); // ✅ log ค่าที่จะส่ง

    await updateAchievement(parsedValue);
    onSettingStepTarget(); // ปิด modal
  };

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
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  endContent={
                    <Footprints className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                  }
                  label="Steps Target"
                  placeholder="Enter Target Steps"
                  variant="bordered"
                  isDisabled={loading}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdate}
                  isDisabled={loading}
                >
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
