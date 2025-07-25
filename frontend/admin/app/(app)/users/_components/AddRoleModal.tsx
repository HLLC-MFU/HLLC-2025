import React, { FormEvent, useState, useEffect } from 'react';
import {
  Button,
  Form,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Checkbox,
  Card,
  CardHeader,
} from '@heroui/react';
import { Trash2 } from 'lucide-react';

import { Role } from '@/types/role';
import { useUsers } from '@/hooks/useUsers';

type AddRoleProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddRole: (role: Partial<Role>) => void;
  schools: any[];
  majors: any[];
  users: any[];
};

type Field = {
  key: string;
  label: string;
  type: string;
  required: boolean;
};

const typeOptions = ['string', 'number', 'boolean', 'date'];

export default function AddRoleModal({
  isOpen,
  onClose,
  onAddRole,
  schools,
  majors,
  users,
}: AddRoleProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [roleName, setRoleName] = useState<string>('');
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchTimeout, setUserSearchTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { fetchByUsername } = useUsers();
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (userSearchTimeout) clearTimeout(userSearchTimeout);
    if (userSearch.trim()) {
      setLoading(true);
      const timeout = setTimeout(async () => {
        const found = await fetchByUsername(userSearch);
        setSearchResults(found);
        setLoading(false);
      }, 300);
      setUserSearchTimeout(timeout);
    } else {
      setSearchResults([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch]);

  const handleRemoveUser = (id: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== id));
  };

  const handleClearAll = () => setSelectedUsers([]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const metadataSchema: Role['metadataSchema'] = fields.reduce(
      (acc, field) => {
        acc[field.label] = {
          type: field.type,
          label: field.label,
          required: field.required,
        };
        return acc;
      },
      {} as NonNullable<Role['metadataSchema']>,
    );

    const formData: Partial<Role> = {
      name: roleName,
      metadataSchema,
      metadata: {
        canCheckin: {
          major: selectedMajors,
          school: selectedSchools,
          user: selectedUsers.map((u) => u._id || u.id),
        }
      }
    };

    onAddRole(formData);
    setFields([]);
    setRoleName('');
    setSelectedMajors([]);
    setSelectedSchools([]);
    setSelectedUsers([]);
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      { key: '', label: '', type: 'string', required: false },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = <K extends keyof Field>(
    index: number,
    key: K,
    value: Field[K],
  ) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  return (
    <Modal
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      isOpen={isOpen}
      size="xl"
      onClose={onClose}
    >
      <ModalContent>
        <Form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            Add new role
          </ModalHeader>
          <ModalBody className="w-full flex flex-col gap-3 max-h-screen overflow">
            <Input
              isRequired
              label="Role Name"
              placeholder="Enter Role Name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
            <Card shadow="none">
              <CardHeader className="flex flex-row justify-between items-center">
                <p className="text-sm font-semibold">Metadata Fields</p>
                <Button
                  color="primary"
                  size="sm"
                  variant="light"
                  onPress={handleAddField}
                >
                  + Add Field
                </Button>
              </CardHeader>
              {fields.map((field, index) => (
                <div key={index} className="flex flex-row gap-2 items-end">
                  <Input
                    className="flex-1"
                    label="Label"
                    placeholder="e.g., Major"
                    value={field.label}
                    variant="underlined"
                    onChange={(e) =>
                      handleFieldChange(index, 'label', e.target.value)
                    }
                  />
                  <Select
                    className="flex-1"
                    label="Type"
                    selectedKeys={new Set([field.type])}
                    variant="underlined"
                    onSelectionChange={(val) => {
                      const selected = Array.from(val)[0] as string;

                      handleFieldChange(index, 'type', selected);
                    }}
                  >
                    {typeOptions.map((t) => (
                      <SelectItem key={t}>{t}</SelectItem>
                    ))}
                  </Select>
                  <div className="flex gap-2 items-center">
                    <Checkbox
                      isSelected={field.required}
                      size="sm"
                      onValueChange={(val) =>
                        handleFieldChange(index, 'required', val)
                      }
                    >
                      Required
                    </Checkbox>
                    <Button
                      isIconOnly
                      color="danger"
                      variant="light"
                      onPress={() => handleRemoveField(index)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </Card>

            {/* Metadata Select Fields Card */}
            <Card shadow="none">
              <CardHeader className="flex flex-row justify-between items-center">
                <p className="text-sm font-semibold">Metadata Select Fields</p>
              </CardHeader>

              <div className="p-4 space-y-4" >
                {/* Major Selection */}
                <div className="flex flex-row gap-2 items-end">
                  <Input
                    className="w-32"
                    label="Field"
                    value="major"
                    variant="underlined"
                    isReadOnly
                  />
                  <Select
                    className="flex-1"
                    label="Select Major(s)"
                    placeholder="Choose majors..."
                    selectionMode="multiple"
                    variant="underlined"
                    selectedKeys={new Set(selectedMajors)}
                    onSelectionChange={(val) => {
                      const selected = Array.from(val) as string[];
                      setSelectedMajors(selected);
                    }}
                  >
                    {majors.map((major: any) => (
                      <SelectItem key={major.id}>{major.name.th}</SelectItem>
                    ))}
                  </Select>
                </div>

                {/* School Selection */}
                <div className="flex flex-row gap-2 items-end">
                  <Input
                    className="w-32"
                    label="Field"
                    value="school"
                    variant="underlined"
                    isReadOnly
                  />
                  <Select
                    className="flex-1"
                    label="Select School(s)"
                    placeholder="Choose schools..."
                    selectionMode="multiple"
                    variant="underlined"
                    selectedKeys={new Set(selectedSchools)}
                    onSelectionChange={(val) => {
                      const selected = Array.from(val) as string[];
                      setSelectedSchools(selected);
                    }}
                  >
                    {schools.map((school: any) => (
                      <SelectItem key={school.id}>{school.name.en}</SelectItem>
                    ))}
                  </Select>
                </div>


                <div className="flex flex-row gap-2 items-end">
                  <Input
                    className="relative w-32"
                    label="Field"
                    value="user"
                    variant="underlined"
                    isReadOnly
                  />
                  <div className="flex-1 flex flex-col gap-2 relative">
                    <Input
                      label="Search Users"
                      placeholder="Type username or name..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      autoComplete="off"
                    />
                    {/* Dropdown */}
                    {userSearch && (loading || searchResults.length > 0) && (
                      <div className="relative top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 mt-1 max-h-56 overflow-y-auto">
                        {loading ? (
                          <div className="p-4 text-center text-gray-400">
                            Loading...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-center text-gray-400">
                            No users found
                          </div>
                        ) : (
                          searchResults
                            .filter(
                              (u) =>
                                !selectedUsers.some((su) => su.id === u.id),
                            )
                            .map((user) => (
                              <div
                                key={user._id}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 transition"
                                onClick={() => {
                                  setSelectedUsers([...selectedUsers, user]);
                                  setUserSearch('');
                                }}
                              >
                                <span className="font-medium text-blue-700">
                                  {user.username}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {user.name?.first ||
                                    user.name?.en ||
                                    user.name?.th}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    )}
                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        <Button
                          size="sm"
                          variant="light"
                          color="default"
                          onPress={handleClearAll}
                        >
                          Clear All
                        </Button>
                        {selectedUsers.slice(0, 3).map((user) => (
                          <span
                            key={user._id}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1"
                          >
                            {user.username}
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="light"
                              onPress={() => handleRemoveUser(user.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </span>
                        ))}
                        {selectedUsers.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{selectedUsers.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </ModalBody>
          <ModalFooter className="w-full">
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Confirm
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
}
