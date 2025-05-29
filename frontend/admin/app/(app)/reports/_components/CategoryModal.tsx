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
  category?: Category;
  mode: 'add' | 'edit';
}

export function CategoryModal({ isOpen, onClose, onSubmit, category, mode }: CategoryModalProps) {
  const [nameEn, setNameEn] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionTh, setDescriptionTh] = useState('');
  const [color, setColor] = useState('#000000');

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
      let saved;

      if (mode === 'edit' && category?.id) {
        // 🔁 UPDATE ไป backend
        const res = await fetch(`http://localhost:8080/api/categories/${category.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        saved = await res.json();
      } else {
        // ➕ ADD ใหม่
        const res = await fetch('http://localhost:8080/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        saved = await res.json();
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
        color: '',
      };

      onSubmit(updatedCategory);
    } catch (error) {
      console.error('Error saving category:', error);
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === 'add' ? 'Add New Category' : 'Edit Category'}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
