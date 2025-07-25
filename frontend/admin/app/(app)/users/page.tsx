'use client';

import React, { useState } from 'react';
import { Accordion, AccordionItem, addToast, Button } from '@heroui/react';
import {
  MonitorSmartphone,
  Plus,
  Smartphone,
  UserRound,
  UserRoundCog,
  UserRoundSearch,
} from 'lucide-react';

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
  const { roles, createRole, updateRole, deleteRole, loading: rolesLoading, fetchRoles } = useRoles();
  const { schools, loading: schoolsLoading } = useSchools();
  const { majors, loading: majorsLoading } = useMajors();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { removePassword } = useAuth();
  const { devices, loading: devicesLoading } = useDevices();
  const [filteredCount, setFilteredCount] = useState<number>(0);

  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [modal, setModal] = useState({
    add: false,
    import: false,
    export: false,
    confirm: false,
  });
  const [actionMode, setActionMode] = useState<'Add' | 'Edit'>('Add');
  const [confirmMode, setConfirmMode] = useState<'Delete' | 'Reset'>('Delete');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleModalMode, setRoleModalMode] = useState<'Add' | 'Edit'>('Add');
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false);

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

  const handleAddRole = async (roleData: Partial<Role>) => {
    if (roleModalMode === 'Edit' && selectedRole?._id) {
      await updateRole(selectedRole._id, roleData);
      addToast({ title: "Role updated successfully", color: "success" });
    } else {
      await createRole(roleData);
      addToast({ title: "Role created successfully", color: "success" });
    }
    setIsRoleOpen(false);
    setSelectedRole(null);
    setRoleModalMode('Add');
    await fetchRoles();
  };

  const handleEditRole = (role: Role) => {
    console.log('Editing role:', role); // Debug log
    setSelectedRole(role);
    setRoleModalMode('Edit');
    setIsRoleOpen(true);
  };

  const handleDeleteRole = async () => {
    if (selectedRole?._id) {
      await deleteRole(selectedRole._id);
      addToast({ title: "Role deleted successfully", color: "success" });
      setIsDeleteRoleOpen(false);
      setSelectedRole(null);
      await fetchRoles();
    }
  };

  const handleDeleteRoleClick = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteRoleOpen(true);
  };

  const handleAdd = async (user: Partial<User>, userAction?: User) => {
    const response =
      actionMode === 'Add'
        ? await createUser(user)
        : actionMode === 'Edit' && userAction
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

  const handleConfirm = async () => {
    if (!selectedUser) return;
    let response = null;

    if (confirmMode === 'Delete') {
      // response = Array.from(selectedKeys).length > 1
      //   ? await deleteMultiple(Array.from(selectedKeys) as string[])
      //   : await deleteUser(userAction._id);
      response = await deleteUser(selectedUser._id);
    } else {
      // await removePassword(userAction.username);
    }
    setModal((prev) => ({ ...prev, confirm: false }));

    // console.log("ทำไหมไม่ fetch", response);
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
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
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
            : roles.map((role) => {
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
                      selectedUser={selectedUser}
                      setSelectedUser={setSelectedUser}
                      onRoleEdit={() => handleEditRole(role)}
                      onRoleDelete={() => handleDeleteRoleClick(role)}
                    />
                  </AccordionItem>
                );
              })}
        </Accordion>
        <Accordion className="px-0" variant="splitted">
      <AccordionItem
        key="device-accordion"
        aria-label="Devices"
        className="font-medium mb-2"
        title={
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="w-5 h-5" />
            <span>Devices ({filteredCount})</span>
          </div>
        }
      >
        <DeviceTable
          devices={devices}
          loading={devicesLoading}
          onFilteredCountChange={setFilteredCount}
        />
      </AccordionItem>
    </Accordion>

        <AddRoleModal
          isOpen={isRoleOpen}
          onAddRole={handleAddRole}
          onClose={() => {
            setIsRoleOpen(false);
            setSelectedRole(null);
            setRoleModalMode('Add');
          }}
          schools={schools}
          majors={majors}
          users={users}
          editingRole={selectedRole}
          mode={roleModalMode}
        />
        
        {/* Delete Role Confirmation Modal */}
        {isDeleteRoleOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col gap-4 min-w-[300px]">
              <div className="text-lg font-semibold">Confirm Role Deletion</div>
              <div>Are you sure you want to delete the role <span className="font-bold">{selectedRole?.name}</span>?</div>
              <div className="flex gap-2 justify-end">
                <Button variant="light" onPress={() => setIsDeleteRoleOpen(false)}>Cancel</Button>
                <Button color="danger" onPress={handleDeleteRole}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
