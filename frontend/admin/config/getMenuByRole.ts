// lib/getMenuByRole.ts
import { siteConfig } from "@/config/site";
import type { User } from "@/hooks/useProfile";

export const getMenuByRole = (user: User | null) => {
    if (!user?.role?.name) return [];

    const roleName = user.role.name.toLowerCase();

    if (roleName.startsWith("smo")) {
        return siteConfig.navMenuItems
            .map((section) => ({
                ...section,
                items: section.items.filter((item) =>
                    ["/checkin", "/logout"].includes(item.href)
                ),
            }))
            .filter((section) => section.items.length > 0);
    }

    if (roleName === "administrator") {
        return siteConfig.navMenuItems;
    }

    if (roleName === "staff" || roleName === "mentee") {
        return siteConfig.navMenuItems
            .map((section) => ({
                ...section,
                items: section.items.filter((item) =>
                    ["/dashboard", "/checkin", "/coin-hunting", "/step-counters", "/logout"].includes(item.href)
                ),
            }))
            .filter((section) => section.items.length > 0);
    }

    if (roleName === "mentor") {
        return siteConfig.navMenuItems
            .map((section) => ({
                ...section,
                items: section.items.filter((item) =>
                    ["/dashboard", "/users", "/step-counters", "/logout"].includes(item.href)
                ),
            }))
            .filter((section) => section.items.length > 0);
    }

    if (roleName === "ae") {
        return siteConfig.navMenuItems
            .map((section) => ({
                ...section,
                items: section.items.filter((item) =>
                    ["/chat", "/sponsor-systems", "/logout"].includes(item.href)
                ),
            }))
            .filter((section) => section.items.length > 0);
    }

    return siteConfig.navMenuItems
        .map((section) => ({
            ...section,
            items: section.items.filter((item) =>
                ["/dashboard", "/logout"].includes(item.href)
            ),
        }))
        .filter((section) => section.items.length > 0);
};

