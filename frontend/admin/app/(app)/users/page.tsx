'use client';

import React, { useState } from 'react';
import { Accordion, AccordionItem, addToast, Button } from '@heroui/react';
import { Plus, UserRound, UserRoundCog, UserRoundSearch } from 'lucide-react';

import UsersTable from './_components/UserTable';
import AddRoleModal from './_components/AddRoleModal';

import { useUsers } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { User } from '@/types/user';
import { Role } from '@/types/role';
import { useSchools } from '@/hooks/useSchool';
import { PageHeader } from '@/components/ui/page-header';
import { useMajors } from '@/hooks/useMajor';
import useAuth from '@/hooks/useAuth';
import DeviceTable from './_components/DeviceTable';
import { useDevices } from '@/hooks/useDevices';

export const columns = [
  { name: 'USERNAME', uid: 'username', sortable: true },
  { name: 'NAME', uid: 'name' },
  { name: 'SCHOOL', uid: 'school' },
  { name: 'MAJOR', uid: 'major' },
  { name: 'ACTIONS', uid: 'actions' },
];

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}
const INITIAL_VISIBLE_COLUMNS = [
  'username',
  'name',
  'school',
  'major',
  'actions',
];

export default function ManagementPage() {
  const {
    users,
    loading: usersLoading,
    fetchUsers,
    createUser,
    updateUser,
    uploadUser,
    deleteUser,
    deleteMultiple,
  } = useUsers();
  const { roles, createRole, loading: rolesLoading } = useRoles();
  const { schools, loading: schoolsLoading } = useSchools();
  const { majors, loading: majorsLoading } = useMajors();
  const { removePassword } = useAuth();
  const { devices, loading: devicesLoading } = useDevices();


  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [modal, setModal] = useState({
    add: false,
    import: false,
    export: false,
    confirm: false,
  });
  const [actionMode, setActionMode] = useState<'Add' | 'Edit'>('Add');
  const [confirmMode, setConfirmMode] = useState<'Delete' | 'Reset'>('Delete');

  const isLoading =
    usersLoading || rolesLoading || schoolsLoading || majorsLoading;

  const groupedByRoleId: Record<string, User[]> = {};

  users.forEach((user) => {
    const roleId = typeof user.role === 'object' && user.role?._id;

    if (!roleId) return;
    if (!groupedByRoleId[roleId]) groupedByRoleId[roleId] = [];
    groupedByRoleId[roleId].push(user);
  });

  const roleIcons: Record<string, React.ReactNode> = {
    Administrator: <UserRoundCog />,
    User: <UserRound />,
    Mentee: <UserRoundSearch />,
  };

  const handleAddRole = (roleData: Partial<Role>) => {
    createRole(roleData);
    setIsRoleOpen(false);
  };

  const handleAdd = async (user: Partial<User>, userAction: User) => {
    const response =
      actionMode === 'Add'
        ? await createUser(user)
        : actionMode === 'Edit'
          ? await updateUser(userAction._id, user)
          : null;

    setModal((prev) => ({ ...prev, add: false }));

    if (response) {
      await fetchUsers();
      addToast({
        title: 'Add Successfully',
        description: 'Data has added successfully',
        color: 'success',
      });
    }
  };

  const handleImport = async (users: Partial<User>[]) => {
    const response = await uploadUser(users);

    setModal((prev) => ({ ...prev, import: false }));

    if (response) {
      await fetchUsers();
      addToast({
        title: 'Import Successfully',
        description: 'Data has imported successfully',
        color: 'success',
      });
    }
  };

  const handleConfirm = async (
    selectedKeys: 'all' | Set<string | number>,
    userAction: User,
  ) => {
    let response = null;

    if (confirmMode === 'Delete') {
      response =
        Array.from(selectedKeys).length > 1
          ? await deleteMultiple(Array.from(selectedKeys) as string[])
          : await deleteUser(userAction._id);
    } else {
      await removePassword(userAction.username);
    }
    setModal((prev) => ({ ...prev, confirm: false }));

    if (response) {
      await fetchUsers();
      addToast({
        title: `${confirmMode} Successfully`,
        description: `Data has ${confirmMode.toLowerCase()} successfully`,
        color: 'success',
      });
    }
  };

  return (
    <>
      <PageHeader
        description="Manage users, roles, and relative data."
        icon={<UserRound />}
        right={
          <Button
            color="primary"
            endContent={<Plus size={20} />}
            size="lg"
            onPress={() => setIsRoleOpen(true)}
          >
            New Role
          </Button>
        }
        title="User Management"
      />

      <div className="flex flex-col gap-6">
        <Accordion className="px-0" variant="splitted">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <AccordionItem
                key={`skeleton-${index}`}
                aria-label={`Loading ${index}`}
                title={
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                }
              >
                <div className="h-[100px] w-full bg-gray-100 rounded-md animate-pulse" />
              </AccordionItem>
            ))
          ) : (
            <>
              {roles.map((role) => {
                const roleName = role.name ?? 'Unnamed';
                const roleUsers = groupedByRoleId[role._id] || [];

                return (
                  <AccordionItem
                    key={role._id}
                    aria-label={String(roleName)}
                    className="font-medium mb-2"
                    startContent={
                      <div className="p-3 rounded-xl bg-gradient-to-r bg-gray-200 border">
                        <span className="text-gray-500">
                          {roleIcons[roleName] || <UserRound />}
                        </span>
                      </div>
                    }
                    subtitle={
                      <p className="flex">
                        <span className="text-primary ml-1">{`${roleUsers.length} users`}</span>
                      </p>
                    }
                    title={roleName}
                  >
                    <UsersTable
                      actionMode={actionMode}
                      capitalize={capitalize}
                      columns={columns}
                      confirmMode={confirmMode}
                      initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
                      majors={majors}
                      modal={modal}
                      roleId={role._id}
                      schools={schools}
                      setActionMode={setActionMode}
                      setConfirmMode={setConfirmMode}
                      setModal={setModal}
                      users={roleUsers}
                      onAdd={handleAdd}
                      onConfirm={handleConfirm}
                      onImport={handleImport}
                    />
                  </AccordionItem>
                );
              })}
            </>
          )}
        </Accordion>
        <Accordion className="px-0" variant="splitted">
          <AccordionItem
            key="device-accordion"
            aria-label="Devices"
            title="Devices"
          >
             <DeviceTable devices={devices} loading={devicesLoading} />
          </AccordionItem>
        </Accordion>

        <AddRoleModal
          isOpen={isRoleOpen}
          onAddRole={handleAddRole}
          onClose={() => setIsRoleOpen(false)}
        />
      </div>
    </>
  );
}
