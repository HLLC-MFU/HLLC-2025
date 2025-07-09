"use client";
import { useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";

export default function Layout({ children }: { children: React.ReactNode }) {
  const setUser = useProfile((state) => state.setUser);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchUserWithMajor = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const json = await res.json();

        let fetchedUser = json.data?.[0];
        if (!fetchedUser) return;

        const major = fetchedUser?.metadata?.major;

        const needsMajorDetails =
          !major?.name?.en || !major?.school?.name?.en;

        if (needsMajorDetails && major?._id) {
          const majorRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/majors?limit=0`, {
            credentials: "include",
          });
          const majorJson = await majorRes.json();
          const majorList = majorJson.data ?? [];

          const matched = majorList.find((m: any) => m._id === major._id);
          if (matched) {
            fetchedUser = {
              ...fetchedUser,
              metadata: {
                ...fetchedUser.metadata,
                major: matched,
              },
            };
          }
        }

        setUser(fetchedUser);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    fetchUserWithMajor();
  }, [setUser]);

  return <>{children}</>;
}