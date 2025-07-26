"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";

import useAuth from "@/hooks/useAuth";

export default function LogoutPage() {
    const { signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const logout = async () => {
            try {
                await signOut(); // ← this now truly waits
            } catch (err) {
                console.error("Logout error:", err);
            } finally {
                router.replace("/login"); // better than push to avoid back-nav to logout
            }
        };

        logout();
    }, [signOut, router]);


    return (
        <div className="flex items-center justify-center h-screen">
            <Spinner
                classNames={{ label: "text-foreground mt-4" }}
                size="lg"
                variant="simple"
            />
        </div>
    );
}
