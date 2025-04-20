"use client";

import { Chip, Card, Badge, Divider, Button } from "@heroui/react";
import { Majors } from "@/types/majors";
import BlurModal from "@/components/Modals/BlurModal";
import { AcademicCapIcon, CalendarIcon, PencilIcon } from "@heroicons/react/24/outline";

interface MajorModalProps {
  isOpen: boolean;
  onClose: () => void;
  major: Majors | null;
  onEdit?: (major: Majors) => void;
}

export default function MajorModal({ isOpen, onClose, major, onEdit }: MajorModalProps) {
  if (!major) {
    return null;
  }

  return (
    <BlurModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-secondary-50 dark:bg-secondary-900">
            <AcademicCapIcon className="w-6 h-6 text-secondary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {major.acronym && (
                <Chip variant="flat" color="secondary" className="font-mono">
                  {major.acronym}
                </Chip>
              )}
              <h2 className="text-xl font-bold">{major.name}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              Created {new Date(major.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      }
      footer={
        onEdit ? (
          <div className="flex justify-end">
            <Button
              color="secondary"
              variant="flat"
              startContent={<PencilIcon className="w-4 h-4" />}
              onPress={() => onEdit(major)}
            >
              Edit Major
            </Button>
          </div>
        ) : (
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-6">
        <Card className="p-4 bg-gradient-to-br from-secondary-50 to-white dark:from-secondary-900 dark:to-gray-900 border border-secondary-100 dark:border-secondary-800">
          <h3 className="text-lg font-semibold mb-2">About this Major</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {major.details || "No description available."}
          </p>
        </Card>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs text-gray-500">School</h4>
              <p className="font-medium">{"N/A"}</p>
            </div>
            <div>
              <h4 className="text-xs text-gray-500">Acronym</h4>
              <p className="font-medium">{major.acronym || "N/A"}</p>
            </div>
          </div>
        </div>
        
        <Divider />
        
        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">ID Reference</h3>
          <Badge variant="flat" color="default" className="w-full overflow-hidden text-ellipsis">
            {major.id}
          </Badge>
        </div>
      </div>
    </BlurModal>
  );
}
