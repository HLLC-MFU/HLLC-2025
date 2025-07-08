"use client";
import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { ProfileSkeleton } from "./ProfileSkeleton";
import { useProfile } from "@/hooks/useProfile";
import { BadgeCheck, GraduationCap, IdCard, LucideIcon, School, UserCircle } from "lucide-react";

export default function ProfileCard() {
  const user = useProfile((state) => state.user);
  const majorName = useProfile((state) => state.majorName);
  const schoolName = useProfile((state) => state.schoolName);
  const setUser = useProfile((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  console.log(user)

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

  const iconMap: Record<string, LucideIcon> = {
    NAME: UserCircle,
    "STUDENT ID": IdCard,
    SCHOOL: School,
    MAJOR: GraduationCap,
  };

  const profileItems = [
    { label: "NAME", value: fullName },
    { label: "STUDENT ID", value: user.username },
    { label: "SCHOOL", value: schoolName ?? "-" },
    { label: "MAJOR", value: majorName ?? "-" },
  ];

  return (
    <Card
      className="py-4 bg-black/20 backdrop-blur-md border border-white rounded-2xl shadow-lg"
    >
      <CardBody className="pb-0 pt-2 px-4 flex-col items-start space-y-4">
        {profileItems.map(({ label, value }, index) => {
          const Icon = iconMap[label];

          return (
            <div
              key={index}
              className="flex items-center space-x-4 min-h-[60px]"
            >
              {Icon && (
                <Icon className="w-10 h-10 rounded-full shrink-0 text-white" />
              )}

              <div className="flex flex-col justify-center">
                <h4 className="font-bold text-large uppercase leading-tight text-white">
                  {label}
                </h4>
                <p className="uppercase leading-tight text-white/80">
                  {value}
                </p>
              </div>
            </div>
          );
        })}
      </CardBody>
    </Card>

  );
}