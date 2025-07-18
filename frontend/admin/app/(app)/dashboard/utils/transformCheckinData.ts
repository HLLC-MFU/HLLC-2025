import { Checkin } from "@/types/checkin";

export function transformCheckinData(checkins: Checkin[]) {
    const grouped = new Map<string, number>();

    checkins.forEach((c) => {
        const actId = c.activity?._id;
        if (!actId) return;

        if (grouped.has(actId)) {
            grouped.set(actId, grouped.get(actId)! + 1);
        } else {
            grouped.set(actId, 1);
        }
    });

    const data = Array.from(grouped.entries()).map(([actId, count]) => {
        return {
            activty:
                checkins.find((c) => c.activity?._id === actId)?.activity?.name?.en ||
                checkins.find((c) => c.activity?._id === actId)?.activity?.name?.th ||
                "-",
            CheckIn: count,
        };
    });

    return data;
}
