
"use client";

import React from "react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { Plus, UserRound, UserRoundCog, UserRoundSearch } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import UsersTable from "./_components/user-table";
import AddRoleModal from "./_components/AddRoleModal";
import { useRoles } from "@/hooks/useRoles";
import { Role, User } from "@/types/user";
import { useSchools } from "@/hooks/useSchool";

export default function ManagementPage() {
  const { users } = useUsers();
  const { roles, createRole } = useRoles();
  const { schools } = useSchools();
  const [isRoleOpen, setIsRoleOpen] = React.useState(false);

  // 🟢 Group users by their role name
  const groupedUsers: Record<string, { roleName: string, roleId: string; users: User[] }> = {};
  users.forEach((user) => {
    const roleName = user.role?.name || "Unknown";
    const roleId = user.role?._id || "Unknown";
    if (!groupedUsers[roleName]) {
      groupedUsers[roleName] = {
        roleName,
        roleId,
        users: []
      }
    }
    groupedUsers[roleName].users.push(user);
  });

  // 🟢 Icon mapping based on role
  const roleIcons: Record<string, React.ReactNode> = {
    Administrator: <UserRoundCog />,
    User: <UserRound />,
    Mentee: <UserRoundSearch />,
  };

  const handleAddRole = (RoleName: Partial<Role>) => {
    createRole(RoleName);
    setIsRoleOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Users Management</h1>
          <Button color="primary" endContent={<Plus size={20} />} onPress={() => setIsRoleOpen(true)}>New role</Button>
        </div>

        <div className="flex flex-col gap-6">
          <Accordion variant="splitted">
            {[...Object.entries(groupedUsers).map(([roleName, data]) => (
              <AccordionItem
                key={roleName}
                aria-label={roleName}
                startContent={roleIcons[roleName] || <UserRound />}
                title={`${roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()} ( ${groupedUsers[roleName].users.length} )`}
                className="font-medium mb-2"
              >
                {/* ✅ Pass the users in this role to AdminPage */}
                <UsersTable
                  roleName={roleName}
                  roleId={data.roleId}
                  schools={schools}
                  users={data.users}
                />
              </AccordionItem>
            )),
            ...roles.filter((role) => !groupedUsers[`${role.name}`]).map((role) => (
              <AccordionItem
                key={role.name}
                aria-label={role.name}
                startContent={roleIcons[`${role.name}`] || <UserRound />}
                title={`${role.name} ( 0 )`}
                className="font-medium mb-2"
              >
                {/* ✅ Pass the users in this role to AdminPage */}
                <UsersTable
                  roleName={role.name}
                  roleId={role._id}
                  schools={schools}
                  users={[]}
                />
              </AccordionItem>
            ))]}
          </Accordion>
        </div>
      </div>

      <AddRoleModal
        isOpen={isRoleOpen}
        onClose={() => setIsRoleOpen(false)}
        onAddRole={handleAddRole}
      />
    </div>
  );
}