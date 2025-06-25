"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest } from "@/utils/api";
import { IdCard } from "lucide-react";
import {
    Accordion,
    AccordionItem,
} from "@heroui/react";
import { Checkbox } from "@heroui/react";

type Role = {
    _id: string;
    name: string;
    permissions: string[];
};

export default function RolePermissionsPage() {
    const [permissions, setPermissions] = useState<string[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [grouped, setGrouped] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permsRes = await apiRequest("/auth/permissions");
                const perms: string[] = permsRes.data as string[];
                setPermissions(perms);

                const rolesRes = await apiRequest("/roles");
                setRoles(rolesRes.data as Role[]);

                const groupedPerms = perms.reduce((acc: Record<string, string[]>, perm: string) => {
                    const [key] = perm.split(":");
                    acc[key] = acc[key] || [];
                    acc[key].push(perm);
                    return acc;
                }, {});
                setGrouped(groupedPerms);
            } catch (err) {
                console.error("Fetch error:", err);
            }
        };

        fetchData();
    }, []);

    const isPermissionChecked = (role: Role, permission: string): boolean => {
        return role.permissions.includes("*") || role.permissions.includes(permission);
    };

    return (
        <>
            <PageHeader
                description="Assign permissions to roles"
                title="Role Permissions"
                icon={<IdCard />}
            />
            <Accordion selectionMode="multiple" variant="splitted" className="px-0">
                {roles.map((role) => (
                    <AccordionItem key={role._id} title={role.name}>
                        <div className="space-y-6 my-2">
                            {Object.entries(grouped).map(([category, perms]) => (
                                <div key={category}>
                                    <h3 className="text-sm font-semibold capitalize mb-2">{category}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {perms.map((perm) => (
                                            <label key={perm} className="flex items-center gap-2 text-sm">
                                                <Checkbox checked={isPermissionChecked(role, perm)} disabled />
                                                {perm}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionItem>
                ))}
            </Accordion>
        </>
    );
}
