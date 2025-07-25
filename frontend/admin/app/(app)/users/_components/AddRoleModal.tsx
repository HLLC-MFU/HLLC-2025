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
  Switch,
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
  editingRole?: Role | null;
  mode?: 'Add' | 'Edit';
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
  editingRole,
  mode = 'Add',
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
  const [enableMetadata, setEnableMetadata] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingRole && mode === 'Edit') {
        setRoleName(editingRole.name || '');
        if (editingRole.metadataSchema) {
          const convertedFields = Object.entries(editingRole.metadataSchema).map(([key, value]: [string, any]) => ({
            key,
            label: value.label || key,
            type: value.type || 'string',
            required: value.required || false,
          }));
          setFields(convertedFields);
        } else {
          setFields([]);
        }

        if (editingRole.metadata?.canCheckin) {
          setEnableMetadata(true);
          setSelectedMajors(editingRole.metadata.canCheckin.major || []);
          setSelectedSchools(editingRole.metadata.canCheckin.school || []);

          if (editingRole.metadata.canCheckin.user && editingRole.metadata.canCheckin.user.length > 0) {
            const foundUsers = editingRole.metadata.canCheckin.user.map((userId: string) => {
              const foundUser = users.find((u: any) => u._id === userId);
              return foundUser || { _id: userId, username: `User ${userId}` };
            });
            setSelectedUsers(foundUsers);
          } else {
            setSelectedUsers([]);
          }
        } else {
          setEnableMetadata(false);
          setSelectedMajors([]);
          setSelectedSchools([]);
          setSelectedUsers([]);
        }
      } else {
        // Reset form for Add mode
        setRoleName('');
        setFields([]);
        setSelectedMajors([]);
        setSelectedSchools([]);
        setSelectedUsers([]);
        setEnableMetadata(false);
      }
    }
  }, [editingRole, mode, isOpen, users]);

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
  }, [userSearch]);

  const handleRemoveUser = (id: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== id));
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
    };

    // Only add metadata if toggle is enabled
    if (enableMetadata) {
      formData.metadata = {
        canCheckin: {
          major: selectedMajors,
          school: selectedSchools,
          user: selectedUsers.map((u) => u._id),
        }
      };
      console.log('Metadata enabled, sending:', formData.metadata); // Debug log
    } else {
      console.log('Metadata disabled, not sending metadata'); // Debug log
    }

    onAddRole(formData);

    // Reset form after submission
    setFields([]);
    setRoleName('');
    setSelectedMajors([]);
    setSelectedSchools([]);
    setSelectedUsers([]);
    setEnableMetadata(false);
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
            {mode === 'Edit' ? 'Edit Role' : 'Add New Role'}
          </ModalHeader>
          <ModalBody className="w-full p-0">
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
              <div className="flex flex-col gap-3">
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

                {/* Special Permissions Section */}
                <Card shadow="sm" className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">Special Permissions</h3>
                          <p className="text-sm text-gray-500">Configure advanced check-in permissions</p>
                        </div>
                      </div>
                      <Switch
                        isSelected={enableMetadata}
                        onValueChange={(checked) => {
                          setEnableMetadata(checked);
                          // Reset metadata selections when disabled
                          if (!checked) {
                            setSelectedMajors([]);
                            setSelectedSchools([]);
                            setSelectedUsers([]);
                          }
                        }}
                        size="sm"
                        color="primary"
                        classNames={{
                          base: "max-w-full",
                          wrapper: "p-0 h-4 overflow-visible",
                          thumb: "w-6 h-6 border-2 shadow-lg",
                        }}
                      />
                    </div>
                  </CardHeader>

                  {enableMetadata && (
                    <div className="px-6 pb-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                        <p className="text-sm text-blue-700 font-medium">
                          🔐 Configure metadata canCheckin (school, major, user)
                        </p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Metadata Configuration */}
                {enableMetadata ? (
                  <Card shadow="sm" className="border border-gray-200">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-bold">⚙️</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">Metadata Configuration</h4>
                          <p className="text-xs text-gray-500">Set specific checkin</p>
                        </div>
                      </div>
                    </CardHeader>

                    <div className="p-6 space-y-6">
                      {/* Major Selection */}
                      <div className="flex flexe-col sm:flex-row gap-2 items-end">
                        <Input
                          className="w-full sm:w-32"
                          label="Major"
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
                          classNames={{
                            trigger: "min-h-12 bg-white border-gray-200 hover:border-gray-300",
                            value: "text-gray-700",
                          }}
                        >
                          {majors.map((major: any) => (
                            <SelectItem key={String(major._id)}>{major.name.th}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* School Selection */}
                      <div className="flex flex-row gap-2 items-end">
                        <Input
                          className="w-32"
                          label="School"
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
                            <SelectItem key={school._id || school.id}>{school.name.en}</SelectItem>
                          ))}
                        </Select>
                      </div>

                      {/* User Selection */}
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
                                      !selectedUsers.some((su) => su._id === u._id),
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
                                      <span className="text-sm text-blue-700">
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
                            <div className="flex flex-wrap gap-2 mt items-center">
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
                                  className="bg-gray-100 text-xs text-black-250 px-3 py-1 rounded-full flex items-center gap-1"
                                >
                                  {user.username}
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    onPress={() => handleRemoveUser(user._id)}
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
                ) : (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm">Special permissions are disabled. Enable the toggle above to configure check-in permissions.</p>
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="w-full">
            <Button color="danger" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              {mode === 'Edit' ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
}
