import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
} from '@heroui/react';
import { useState, useEffect } from 'react';
import type { ReportTypes } from '@/types/report';
import SendNotiButton from './SendNotiButton';
import StatusDropdown from './Statusdropdown';
import error from 'next/error';


interface ReportTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reporttypes: ReportTypes) => void;
  onAdd: (reporttypes: Partial<ReportTypes>) => void;
  onUpdate: (id: string, reporttypes: Partial<ReportTypes>) => void;
  reporttypes?: ReportTypes;
  mode: 'add' | 'edit';
}

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  reporttypes,
  onAdd,
  onUpdate,
  mode,
}: ReportTypesModalProps) {
  const [nameEn, setNameEn] = useState('');
  const [nameTh, setNameTh] = useState('');

  useEffect(() => {
    if (reporttypes) {
      setNameEn(reporttypes.name.en);
      setNameTh(reporttypes.name.th);
    } else {
      setNameEn('');
      setNameTh('');
    }
  }, [reporttypes]);

  const handleSubmit = async () => {
    if (!nameEn.trim() || !nameTh.trim()) return;

    const payload = {
      name: {
        en: nameEn.trim(),
        th: nameTh.trim(),
      },
    };

    try {
      let saved: any;

      if (mode === 'edit' && reporttypes?.id) {
        saved = await onUpdate(reporttypes.id, payload); 
      } else {
        saved = await onAdd(payload); 
      }

      
      if (!saved) {
        console.warn("No reporttypes data returned from save");
        return;
      }

      const updatedCategory: ReportTypes = {
        id: saved._id,
        name: saved.name,
        createdAt: new Date(saved.createdAt ?? Date.now()),
        updatedAt: new Date(saved.updatedAt ?? Date.now()),
        description: {
          en: '',
          th: '',
        },
        color: '', 
      };

      onSubmit(updatedCategory); 
      console.error('Error saving reporttypes:', error);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === 'add' ? 'Add New ReportTypes' : 'Edit ReportTypes'}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ReportTypes Name (English)"
                placeholder="Enter reporttypes name in English"
                value={nameEn}
                onValueChange={setNameEn}
              />
              <Input
                label="ReportTypes Name (Thai)"
                placeholder="Enter reporttypes name in Thai"
                value={nameTh}
                onValueChange={setNameTh}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}