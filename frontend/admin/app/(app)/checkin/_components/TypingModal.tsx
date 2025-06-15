import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  addToast,
} from '@heroui/react';
import { IdCard } from 'lucide-react';
import { useState } from 'react';
import { useCheckin } from '@/hooks/useCheckin';
import Selectdropdown from './Select';

interface TypingProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Typing({ isOpen, onClose }: TypingProps) {
  const [studentId, setStudentId] = useState('');
  const { createcheckin } = useCheckin();
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  const handleSubmit = () => {
    const trimmed = studentId.trim();
    if (!trimmed) return;

    try {
      createcheckin({
        user: studentId,
        activities: selectedActivityIds,
      });
      addToast({
        title: 'สแกนสำเร็จ',
        description: `${studentId} ได้ทำการ check-in`,
        color: 'success',
      });
    } catch (err) {
      console.error('POST error:', err);
      addToast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งข้อมูลได้',
        color: 'danger',
      });
    }
  };


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
              value={studentId}
              onValueChange={setStudentId}
            />
            <Selectdropdown
              selectedActivityIds={selectedActivityIds}
              setSelectActivityIds={setSelectedActivityIds}
              forceVisible={true}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              Add Student
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}