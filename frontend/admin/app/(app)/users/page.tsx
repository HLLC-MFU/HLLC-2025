"use client";

import React, { useState } from "react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { UserIcon, UserRound, UserRoundCog, UserRoundSearch, Plus } from "lucide-react";

import UsersTable from "./_components/user-table";
import AddRoleModal from "./_components/AddRoleModal";

import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { PageHeader } from "@/components/ui/page-header";
import { Role } from "@/types/user";

export default function ManagementPage() {
  const { users } = useUsers();
  const { createRole } = useRoles();
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  // Group users by their role name
  const groupedUsers: Record<string, typeof users> = {};

  users.forEach((user) => {
    const roleName = user.role?.name || "Unknown";
    if (!groupedUsers[roleName]) groupedUsers[roleName] = [];
    groupedUsers[roleName].push(user);
  });

  // Icon mapping based on role
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
      <PageHeader description='User Management' icon={<UserIcon />} />
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Roles & Users</h1>
            <Button 
              color="primary"
              endContent={<Plus />}
              onPress={() => setIsRoleOpen(true)}
            >
              New Role
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            <Accordion variant="splitted" defaultExpandedKeys={["Administrator"]}>
              {Object.entries(groupedUsers).map(([roleName, users]) => (
                <AccordionItem
                  key={roleName}
                  aria-label={roleName}
                  className="font-medium mb-2"
                  startContent={roleIcons[roleName] || <UserRound />}
                  title={roleName}
                  subtitle={`${users.length} users`}
                >
                  <UsersTable 
                    roleName={roleName} 
                    roleId={users[0]?.role?._id || ""} 
                    users={users}
                    schools={[]} // You'll need to pass schools from a hook or prop
                  />
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      <AddRoleModal
        isOpen={isRoleOpen}
        onClose={() => setIsRoleOpen(false)}
        onAddRole={handleAddRole}
      />
    </>
  );
}