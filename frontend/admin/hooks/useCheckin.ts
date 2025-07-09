import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";

import { Checkin, CheckinCreate } from "@/types/checkin";

export function useCheckin() {
    const [checkin, setCheckin] = useState<Checkin[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchcheckin = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activities/canCheckin`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });
            const res = await response.json();
            console.log("Checkin data:", res);
            setCheckin(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            console.error("Error fetching checkins:", err);
            setError(err.message || "Failed to fetch checkin data.");
        } finally {
            setLoading(false);
        }
    };

    const createcheckin = async (checkinData: Partial<CheckinCreate>) => {
        setLoading(true);
        setError(null);
        try {            
            const payload = {
                user: checkinData.user,
                activities: checkinData.activities
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkins`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const res = await response.json();

            if (response.ok && res.data) {
                setCheckin((prev) => [...prev, res.data]);
                addToast({
                    title: "Check-in successful",
                    description: "User has been checked in successfully",
                    color: "success"
                });

                return res.data;
            } else {
                throw new Error(res.message || "Failed to create check-in");
            }
        } catch (err: any) {
            console.error("Checkin error:", err);
            addToast({
                title: "Check-in failed",
                description: err.message || "Failed to create check-in",
                color: "danger"
            });
            setError(err.message || "Failed to create checkin.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchcheckin();
    }, []);

    return {
        checkin,
        loading,
        error,
        fetchcheckin,
        createcheckin,
    };
}
