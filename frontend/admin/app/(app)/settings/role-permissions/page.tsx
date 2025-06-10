"use client";

import { useEffect, useState } from "react";
import { IdCard } from "lucide-react";
import {
    Accordion,
    AccordionItem,
    addToast,
    Card,
    CardBody,
    CardHeader,
    Checkbox,
    Button,
    Chip,
} from "@heroui/react";

import { apiRequest } from "@/utils/api";
import { PageHeader } from "@/components/ui/page-header";

// Types
type Role = {
    _id: string;
    name: string;
    permissions: string[];
};

// Utils
const actionMap: Record<string, string> = {
    create: "Create",
    read: "View",
    update: "Update",
    delete: "Delete",
    "read:id": "View Detail",
    "update:metadata-schema": "Update Metadata",
    "delete:id": "Delete Specific",
};

const beautify = (str: string) =>
    str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatPermission = (perm: string): string => {
    const parts = perm.split(":");
    const subject = beautify(parts[0] || "");
    const actionKey = parts.slice(1).join(":") || "read";
    const verb = actionMap[actionKey] || beautify(actionKey);

    return `${verb} ${subject}`;
};

// Component
export default function RolePermissionsPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [grouped, setGrouped] = useState<Record<string, string[]>>({});
    const [editedRoles, setEditedRoles] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permsRes = await apiRequest("/auth/permissions");
                const perms: string[] = Array.isArray(permsRes.data) ? permsRes.data : [];

                const rolesRes = await apiRequest("/roles");
                const fetchedRoles = rolesRes.data as Role[];

                setRoles(fetchedRoles);

                const groupedPerms = perms
                    .filter((p) => p !== "*") // ⛔️ filter wildcard
                    .reduce((acc: Record<string, string[]>, perm: string) => {
                        const [category] = perm.split(":");

                        acc[category] = acc[category] || [];
                        acc[category].push(perm);

                        return acc;
                    }, {});

                setGrouped(groupedPerms);
            } catch (err) {
                addToast({
                    title: "Error loading data",
                    description: err instanceof Error ? err.message : "Failed to fetch roles/permissions",
                    color: "danger",
                });
            }
        };

        fetchData();
    }, []);

    const handleCheckboxChange = (roleId: string, perm: string, checked: boolean) => {
        setEditedRoles((prev) => {
            const current = prev[roleId] ?? roles.find((r) => r._id === roleId)?.permissions ?? [];
            const updated = checked
                ? Array.from(new Set([...current, perm]))
                : current.filter((p) => p !== perm && p !== "*");

            return { ...prev, [roleId]: updated };
        });
    };

    const handleSave = async (roleId: string) => {
        const updatedPermissions = editedRoles[roleId];

        if (!updatedPermissions) return;

        try {
            const res = await apiRequest(`/roles/${roleId}/permissions`, "PATCH", { permissions: updatedPermissions });

            console.log("Permissions updated:", res);
            setRoles((prev) =>
                prev.map((r) => (r._id === roleId ? { ...r, permissions: updatedPermissions } : r))
            );

            setEditedRoles((prev) => {
                const copy = { ...prev };

                delete copy[roleId];

                return copy;
            });

            addToast({
                title: "Permissions updated",
                description: "Changes saved successfully.",
                color: "success",
            });
        } catch (err) {
            addToast({
                title: "Save failed",
                description: err instanceof Error ? err.message : "Unable to update permissions",
                color: "danger",
            });
        }
    };

    return (
        <>
            <PageHeader description="Manage what each role can do in the system." icon={<IdCard />} title="Role Permissions" />

            <Accordion className="mt-4" selectionMode="multiple" variant="splitted">
                {roles.map((role) => {
                    const effectivePermissions = editedRoles[role._id] ?? role.permissions;
                    const hasChanges = editedRoles[role._id] && editedRoles[role._id].toString() !== role.permissions.toString();

                    return (
                        <AccordionItem
                            key={role._id}
                            title={
                                <div className="flex items-center justify-between gap-4">
                                    <span className="font-semibold text-base">{role.name}</span>
                                    {hasChanges && <Chip color="warning" size="sm">Unsaved</Chip>}
                                </div>
                            }
                        >
                            {effectivePermissions.includes("*") ? (
                                <div className="text-center text-sm text-gray-600 py-6 italic">
                                    All permissions granted to this role.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(grouped).map(([category, perms]) => (
                                        <Card key={category} className="rounded-xl shadow-sm">
                                            <CardHeader className="pb-1 border-b text-sm font-medium text-gray-700 uppercase tracking-wider">
                                                {beautify(category)}
                                            </CardHeader>
                                            <CardBody className="flex flex-col gap-3 py-3">
                                                {perms.map((perm) => (
                                                    <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <Checkbox
                                                            isSelected={effectivePermissions.includes(perm)}
                                                            onValueChange={(checked) => handleCheckboxChange(role._id, perm, checked)}
                                                        />
                                                        <span className="text-gray-800">{formatPermission(perm)}</span>
                                                    </label>
                                                ))}
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {!effectivePermissions.includes("*") && (
                                <div className="flex justify-end mt-6">
                                    <Button
                                        color="primary"
                                        isDisabled={!hasChanges}
                                        variant="solid"
                                        onPress={() => handleSave(role._id)}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </AccordionItem>
                    );

                })}
            </Accordion>
        </>
    );
}
