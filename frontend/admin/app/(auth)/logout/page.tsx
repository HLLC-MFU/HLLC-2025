
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import useAuth from "@/hooks/useAuth";
import { Spinner } from "@heroui/react";

export default function LogoutPage() {
    const { signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const logout = async () => {
            signOut();
            router.push("/login");
        };

        logout();
    }, [signOut, router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <Spinner classNames={{ label: "text-foreground mt-4" }} variant="simple" size="lg" />
        </div>
    );
}