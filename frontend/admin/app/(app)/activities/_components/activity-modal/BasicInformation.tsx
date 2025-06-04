import { Input, Select, SelectItem } from "@heroui/react";
import { ActivityType } from "@/types/activities";

interface BasicInformationProps {
  nameEn: string;
  setNameEn: (value: string) => void;
  nameTh: string;
  setNameTh: (value: string) => void;
  acronym: string;
  setAcronym: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  activityTypes: ActivityType[];
  typesLoading: boolean;
}

export function BasicInformation({
  nameEn,
  setNameEn,
  nameTh,
  setNameTh,
  acronym,
  setAcronym,
  type,
  setType,
  activityTypes,
  typesLoading
}: BasicInformationProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Basic Information</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Name (English)"
            placeholder="Enter activity name in English"
            value={nameEn}
            onValueChange={setNameEn}
            isRequired
          />
          <Input
            label="Name (Thai)"
            placeholder="Enter activity name in Thai"
            value={nameTh}
            onValueChange={setNameTh}
            isRequired
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Acronym"
            placeholder="Enter activity acronym or leave empty for auto-generation"
            value={acronym}
            onValueChange={setAcronym}
          />
          <Select
            label="Activity Type"
            placeholder="Select an activity type"
            selectedKeys={type ? [type] : []}
            onChange={(e) => setType(e.target.value)}
            isLoading={typesLoading}
            isRequired
          >
            {activityTypes.map((type) => (
              <SelectItem key={type._id}>
                {type.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
} 