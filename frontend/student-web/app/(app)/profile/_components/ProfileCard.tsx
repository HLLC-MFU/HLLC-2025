"use client";
import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { ProfileSkeleton } from "./ProfileSkeleton";
import { useProfile } from "@/hooks/useProfile";

export default function ProfileCard() {
  const user = useProfile((state) => state.user);
  const majorName = useProfile((state) => state.majorName);
  const schoolName = useProfile((state) => state.schoolName);
  const setUser = useProfile((state) => state.setUser);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(true);

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch profile");
          return res.json();
        })
        .then((json) => {
          const fetchedUser = json.data?.[0];
          if (fetchedUser) {
            setUser(fetchedUser);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch user profile", err);
        })
        .finally(() => setLoading(false));
    }
  }, [user, setUser]);

  if (loading) return <ProfileSkeleton />;

  if (!user) return <div>No user data</div>;

  const fullName = [user.name.first, user.name.middle, user.name.last].filter(Boolean).join(" ");

  const profileItems = [
    { label: "NAME", value: fullName },
    { label: "STUDENT ID", value: user.username },
    { label: "SCHOOL", value: schoolName ?? "-" },
    { label: "MAJOR", value: majorName ?? "-" },
  ];

  return (
    <Card className="py-4">
      <CardBody className="pb-0 pt-2 px-4 flex-col items-start space-y-2">
        {profileItems.map(({ label, value }, index) => (
          <div key={index}>
            <h4 className="font-bold text-large">{label}</h4>
            <p className="text-default-500">{value}</p>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}