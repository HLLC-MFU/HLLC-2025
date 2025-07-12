
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
            signOut();
            router.push("/login");
        };

        logout();
    }, [signOut, router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <Spinner classNames={{ label: "text-foreground mt-4" }} size="lg" variant="simple" />
        </div>
    );
}