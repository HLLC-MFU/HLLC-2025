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
import type { Category } from '@/types/report';
import SendNotiButton from './SendNotiButton';
import StatusDropdown from './Statusdropdown';


interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Category) => void;
  onAdd: (category: Partial<Category>) => void;
  onUpdate: (id: string, category: Partial<Category>) => void;
  category?: Category;
  mode: 'add' | 'edit';
}

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  onAdd,
  onUpdate,
  mode,
}: CategoryModalProps) {
  const [nameEn, setNameEn] = useState('');
  const [nameTh, setNameTh] = useState('');

  useEffect(() => {
    if (category) {
      setNameEn(category.name.en);
      setNameTh(category.name.th);
    } else {
      setNameEn('');
      setNameTh('');
    }
  }, [category]);

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

      if (mode === 'edit' && category?.id) {
        saved = await onUpdate(category.id, payload); // ✅ รับ object กลับมา
      } else {
        saved = await onAdd(payload); // ✅ รับ object กลับมา
      }

      // กรณี onAdd หรือ onUpdate ไม่คืนค่า ให้ข้าม onSubmit
      if (!saved) {
        console.warn("No category data returned from save");
        return;
      }

      const updatedCategory: Category = {
        id: saved._id,
        name: saved.name,
        createdAt: new Date(saved.createdAt ?? Date.now()),
        updatedAt: new Date(saved.updatedAt ?? Date.now()),
        description: {
          en: '',
          th: '',
        },
        color: '', // คุณอาจต้องเติม logic สี ถ้ามีในระบบจริง
      };

      onSubmit(updatedCategory); // แจ้ง page.tsx ให้ reset state
    } catch (error) {
      console.error('Error saving category:', error);
    }

    onClose(); // ปิด modal
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === 'add' ? 'Add New Category' : 'Edit Category'}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Category Name (English)"
                placeholder="Enter category name in English"
                value={nameEn}
                onValueChange={setNameEn}
              />
              <Input
                label="Category Name (Thai)"
                placeholder="Enter category name in Thai"
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
