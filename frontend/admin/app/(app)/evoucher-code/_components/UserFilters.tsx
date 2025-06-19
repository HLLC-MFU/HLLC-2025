import { Select, SelectItem, Selection, SelectedItems } from "@heroui/react";
import { School, GraduationCap } from "lucide-react";
import { useMajors } from "@/hooks/useMajor";
import { useSchools } from "@/hooks/useSchool";
import { useState, useEffect } from "react";

interface UserFiltersProps {
  onFilterChange: (filters: { school?: string; major?: string }) => void;
}

export const UserFilters = ({ onFilterChange }: UserFiltersProps) => {
  const { majors } = useMajors();
  const { schools } = useSchools();
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const filteredMajors = selectedSchool
    ? majors.filter(major => major.school === selectedSchool)
    : majors;

  useEffect(() => {
    if (selectedSchool) {
      setSelectedMajor("");
    }
        
    onFilterChange({
      school: selectedSchool || undefined,
      major: selectedMajor || undefined,
    });
  }, [selectedSchool, selectedMajor, onFilterChange]);

  return (
    <div className="flex gap-2">
      <Select
        label="School"
        placeholder="Select a school"
        selectedKeys={selectedSchool ? [selectedSchool] : []}
        onSelectionChange={(keys: Selection) => {
          const selectedKey = Array.from(keys)[0] as string;
          setSelectedSchool(selectedKey);
        }}
        startContent={<School className="text-default-400" size={16} />}
        classNames={{ trigger: "min-w-[200px]" }}
      >
        {[
          <SelectItem key="" textValue="All Schools">
            All Schools
          </SelectItem>,
          ...schools.map((school) => (
            <SelectItem key={school._id} textValue={school.name.en}>
              <div className="flex flex-col">
                <span>{school.name.en}</span>
                <span className="text-tiny text-default-400">{school.name.th}</span>
              </div>
            </SelectItem>
          ))
        ]}
      </Select>

      <Select
        label="Major"
        placeholder="Select a major"
        selectedKeys={selectedMajor ? [selectedMajor] : []}
        onSelectionChange={(keys: Selection) => {
          const selectedKey = Array.from(keys)[0] as string;
          setSelectedMajor(selectedKey);
        }}
        startContent={<GraduationCap className="text-default-400" size={16} />}
        classNames={{ trigger: "min-w-[200px]" }}
      >
        {[
          <SelectItem key="" textValue="All Majors">
            All Majors
          </SelectItem>,
          ...filteredMajors.map((major) => (
            <SelectItem key={major._id} textValue={major.name.en}>
              <div className="flex flex-col">
                <span>{major.name.en}</span>
                <span className="text-tiny text-default-400">{major.name.th}</span>
              </div>
            </SelectItem>
          ))
        ]}
      </Select>
    </div>
  );
}; 