
"use client";

import React from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { UserIcon, UserRound, UserRoundCog, UserRoundSearch } from "lucide-react";

import UsersTable from "./_components/user-table";

import { useUsers } from "@/hooks/useUsers";
import { PageHeader } from "@/components/ui/page-header";
import { Role } from "@/types/user";


export default function ManagementPage() {
  const { users } = useUsers();

  // 🟢 Group users by their role name
  const groupedUsers: Record<string, typeof users> = {};

  users.forEach((user) => {
    const roleName = user.role?.name || "Unknown";

    if (!groupedUsers[roleName]) groupedUsers[roleName] = [];
    groupedUsers[roleName].push(user);
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
    <>
    <PageHeader description='The is Management Page' icon={<UserIcon />} />
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto">
        <div className="flex flex-col gap-6">
          <Accordion variant="splitted">
            {[...Object.entries(groupedUsers).map(([roleName, data]) => (
              <AccordionItem
                key={roleName}
                aria-label={roleName}
                className="font-medium mb-2"
                startContent={roleIcons[roleName] || <UserRound />}
                title={roleName}
              >
                {/* ✅ Pass the users in this role to AdminPage */}
                <UsersTable roleName={roleName} users={roleUsers} />
              </AccordionItem>
            ))]}
          </Accordion>
        </div>
      </div>
    </div>
    </>
  );
}