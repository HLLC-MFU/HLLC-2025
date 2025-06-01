
"use client";

import React from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { UserRound, UserRoundCog, UserRoundSearch } from "lucide-react";
import AdminPage from "./_components/user-table";
import { useUsers } from "@/hooks/useUsers";
import UsersTable from "./_components/user-table";

export default function ManagementPage() {
  const { users, loading } = useUsers();

  if (loading) return <p>Loading...</p>;

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
            {Object.entries(groupedUsers).map(([roleName, roleUsers]) => (
              <AccordionItem
                key={roleName}
                aria-label={roleName}
                startContent={roleIcons[roleName] || <UserRound />}
                title={roleName}
                className="font-medium mb-2"
              >
                {/* ✅ Pass the users in this role to AdminPage */}
                <UsersTable roleName={roleName} users={roleUsers} />
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}