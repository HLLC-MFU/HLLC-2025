'use   client';

import { User } from '@/types/user';
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Divider,
  Form,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import React, { FormEvent, Key, useState } from 'react';
import { Role } from '@/types/role';
import { EvoucherCode } from '@/types/evoucher-code';
import { Evoucher } from '@/types/evoucher';

type AddEvoucherCodeProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (evoucherId: string, userId?: string, roleId?: string) => void;
  evoucherCodes: EvoucherCode[];
  roles: Role[];
  users: User[];
};

export function EvoucherCodeModal({
  isOpen,
  onClose,
  onSuccess,
  evoucherCodes,
  roles,
  users,
}: AddEvoucherCodeProps) {
  const [userId, setUserId] = useState<Key | null>(null);
  const [roleId, setRoleId] = useState<Key | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (userId || roleId) {
      onSuccess(
        (evoucherCodes[0].evoucher as Evoucher)._id ?? '',
        userId?.toString() || '',
        roleId?.toString() || '',
      );
    }

    setUserId(null);
    setRoleId(null);
  };

  const handleCancel = () => {
    onClose();
    setUserId(null);
    setRoleId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} isDismissable={false} placement='top-center'>
      <ModalContent>
        <Form onSubmit={handleSubmit}>
          <ModalHeader>Add Evoucher Code</ModalHeader>
          <ModalBody className="flex gap-4 w-full">
            <span className="font-medium">Add by user</span>
            <Autocomplete
              isRequired={!!!roleId}
              isDisabled={!!roleId}
              label="User"
              placeholder="Select an user"
              defaultItems={users}
              onSelectionChange={setUserId}
              itemHeight={50}
            >
              {(user) => {
                const userName = [
                  user.name.first,
                  user.name.middle,
                  user.name.last,
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <AutocompleteItem
                    key={user._id}
                    textValue={[userName, user.username]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="flex flex-col">
                      <span>{userName}</span>
                      <span className="text-default-500">{user.username}</span>
                    </div>
                  </AutocompleteItem>
                );
              }}
            </Autocomplete>
            <Divider />
            <span className="font-medium">Add by role</span>
            <Autocomplete
              isRequired={!!!userId}
              isDisabled={!!userId}
              label="Role"
              placeholder="Select a role"
              defaultItems={roles}
              onSelectionChange={setRoleId}
            >
              {(role) => (
                <AutocompleteItem key={role._id}>{role.name}</AutocompleteItem>
              )}
            </Autocomplete>
          </ModalBody>
          <ModalFooter className="w-full">
            <Button color="danger" variant="light" onPress={handleCancel}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Add
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
}
