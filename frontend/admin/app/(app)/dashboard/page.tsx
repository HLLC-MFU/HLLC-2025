"use client";

import { useEffect, useState } from "react";
import { addToast, Card, CardBody, Divider } from "@heroui/react";
import { LucideUserCog2, LucideUsers } from "lucide-react";

import BentoCard from "./_components/BentoCard";

import { apiRequest } from "@/utils/api";

type RoleStatistics = {
  registered: number;
  notRegistered: number;
  total: number;
};

type ApiResponse<T> = {
  statusCode: number;
  message: string | null;
  data: T;
};

export default function Dashboard() {
  const [userStatistics, setUserStatistics] = useState<
    Record<string, RoleStatistics> | null
  >(null);

  useEffect(() => {
    const fetchUserStatistics = async () => {
      try {
        const response: ApiResponse<Record<string, RoleStatistics> | null> =
          await apiRequest("/users/statistics");

        if (response.statusCode !== 200) {
          throw new Error(response.message || "Failed to fetch user statistics");
        }

        setUserStatistics(response.data);
      } catch (error) {
        addToast({
          title: "Error fetching user statistics",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
          color: "danger",
        });
      }
    };

    fetchUserStatistics();
  }, []);

  if (!userStatistics) {
    return (
      <section className="flex flex-col min-h-screen justify-center items-center">
        <p className="text-gray-500">Not Found</p>
      </section>
    );
  }

  const studentStats = userStatistics["student"];
  const otherRoles = Object.entries(userStatistics).filter(
    ([role]) => role !== "student"
  );

  return (
    <section className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="grid grid-cols-2 grid-rows-2 gap-4">
          <Card>
            <CardBody className="grid md:grid-cols-2 grid-rows-1 gap-4 uppercase">
              {studentStats && (
                <BentoCard
                  chip={(studentStats.registered / studentStats.total * 100).toString() + " %"}
                  icon={LucideUsers}
                  value={studentStats.total}>
                    <div className="pt-4">
                  <h2 className="text-xl font-bold text-center pb-2">student</h2>
                  <div className="flex justify-evenly text-gray-500">
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-bold">Registered</p>
                      <p className="text-2xl text-primary font-bold">{studentStats.registered}</p>
                    </div>
                    <Divider orientation="vertical" />
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-bold">Total User</p>
                      <p className="text-2xl text-primary font-bold">{studentStats.registered}</p>
                    </div>
                  </div>
                  </div>
                </BentoCard>
              )}

              {otherRoles.length > 0 && (
                <BentoCard
                  icon={LucideUserCog2}
                  value={studentStats.total}>
                  <div>
                    {otherRoles.map(([role, stats]) => (
                      <div key={role}>
                        <span className="font-semibold uppercase">{role}:</span>{" "}
                        {stats.total}
                      </div>
                    ))}
                  </div>
                </BentoCard>

              )}

            </CardBody>
          </Card>
          <Card />
        </div>

      </div>
    </section>
  );
}
