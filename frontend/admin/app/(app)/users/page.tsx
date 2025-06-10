"use client";

import React from "react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { Plus, UserRound, UserRoundCog, UserRoundSearch } from "lucide-react";

import UsersTable from "./_components/UserTable";
import AddRoleModal from "./_components/AddRoleModal";

import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { User } from "@/types/user";
import { Role } from "@/types/role";
import { useSchools } from "@/hooks/useSchool";
import { PageHeader } from "@/components/ui/page-header";
import { useMajors } from "@/hooks/useMajor";

export default function ManagementPage() {
  const { users, loading: usersLoading } = useUsers();
  const { roles, createRole, loading: rolesLoading } = useRoles();
  const { schools, loading: schoolsLoading } = useSchools();
  const { majors, loading: majorsLoading } = useMajors();
  const [isRoleOpen, setIsRoleOpen] = React.useState(false);

  const isLoading = usersLoading || rolesLoading || schoolsLoading || majorsLoading;

  const groupedByRoleId: Record<string, User[]> = {};

  users.forEach((user) => {
    const roleId = user.role?._id;

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
        roles.map((role) => {
          const roleName = role.name ?? "Unnamed";
          const roleUsers = groupedByRoleId[role._id] || [];

              return (
                <AccordionItem
                  key={role._id}
                  aria-label={String(roleName)}
                  className="font-medium mb-2"
                  startContent={
                    <div className="p-3 rounded-xl bg-gradient-to-r bg-gray-200 border">
                      <span className="text-gray-500">{roleIcons[roleName] || <UserRound />}</span>   
                    </div>
                  }
                  title={roleName}
                  subtitle={
                    <p className="flex">
                      Total : <span className="text-primary ml-1">{roleUsers.length}</span>
                    </p>
                  }
                >
                  <UsersTable
                    majors={majors}
                    roleId={role._id}
                    roleName={roleName}
                    schools={schools}
                    users={roleUsers}
                  />
                </AccordionItem>
              );
            })
          )}
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
