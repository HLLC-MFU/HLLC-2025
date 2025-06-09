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
import { PageHeader } from "@/components/ui/page-header";
import { useMajors } from "@/hooks/useMajor";

export default function ManagementPage() {
  const { users } = useUsers();
  const { roles, createRole } = useRoles();
  const { schools } = useSchools();
  const { majors } = useMajors();
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
      <PageHeader description='This is Management Page' icon={<UserRound />} right={
        <Button color="primary" size="lg" endContent={<Plus size={20}/>} onPress={() => setIsRoleOpen(true)}>New Role</Button>
      } />
      <div className="flex flex-col">
        <div className="flex flex-col gap-6">
          <Accordion variant="splitted" className="px-0">
            {[...Object.entries(groupedUsers).map(([roleName, data]) => (
              console.log(roleName, data),
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
                  majors={majors}
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
                  roleName={role.name ?? "Unknown"}
                  roleId={role._id}
                  majors={majors}
                  schools={schools}
                  users={[]}
                />
              </AccordionItem>
            ))]}
          </Accordion>
        </div>

        <AddRoleModal
          isOpen={isRoleOpen}
          onClose={() => setIsRoleOpen(false)}
          onAddRole={handleAddRole}
        />
      </div>

    </>
  );
}