
"use client";

import React from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { UserRound, UserRoundCog, UserRoundSearch } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import UsersTable from "./_components/user-table";

export default function ManagementPage() {
  const { users } = useUsers();

  // 🟢 Group users by their role name
  const groupedUsers: Record<string, {roleId: string; users: typeof users}> = {};
  users.forEach((user) => {
    // console.log(user);
    const roleName = user.role?.name || "Unknown";
    const roleId = user.role?._id?.toString() || "";
    if (!groupedUsers[roleName]) {
      groupedUsers[roleName] = {
        roleId,
        users: [],
      };
    };
    groupedUsers[roleName].users.push(user);
  });

  // 🟢 Icon mapping based on role
  const roleIcons: Record<string, React.ReactNode> = {
    Administrator: <UserRoundCog />,
    User: <UserRound />,
    Mentee: <UserRoundSearch />,
    Unknown: <UserRound />,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Users Management</h1>
        </div>

        <div className="flex flex-col gap-6">
          <Accordion variant="splitted">
            {Object.entries(groupedUsers).map(([roleName, data]) => (
              <AccordionItem
                key={roleName}
                aria-label={roleName}
                startContent={roleIcons[roleName] || <UserRound />}
                title={roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase()}
                className="font-medium mb-2"
              >
                {/* ✅ Pass the users in this role to AdminPage */}
                <UsersTable
                  roleName={roleName}
                  roleId={data.roleId}
                  users={data.users}
                />
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}