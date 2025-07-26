import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getCookie, isTokenValid } from "@/lib/cookies.utils";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    const router = useRouter();

    useEffect(() => {
        const token = getCookie("token");

        if (!token || !isTokenValid(token)) {
            
            router.push("/login");
            // Optionally redirect to login
        } else {
            router.push("/dashboard");
        }
    }, []);

    return (
        <>
            {children}
        </>
    );
}