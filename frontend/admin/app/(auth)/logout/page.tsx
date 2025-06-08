
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
        <p className="text-lg">Logging out...</p>
        </div>
    );
}