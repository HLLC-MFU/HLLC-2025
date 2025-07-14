import { ProgressBarActivities } from "@/types/progress";
import { Card, CardBody, Progress } from "@heroui/react";

type ProgressBarProps = {
    progressBarActivities: ProgressBarActivities | null;
    loading: boolean
}

export function ProgressBar({ progressBarActivities, loading }: ProgressBarProps) {
    return (
        <Card className="flex w-full bg-white/10 backdrop-blur">
            <CardBody>
                {loading && <p>Loading...</p>}
                {!loading && progressBarActivities && (
                    <div className="flex flex-col justify-center items-center">
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-grow">
                                <Progress
                                    aria-label="Loading..."
                                    value={progressBarActivities.progressPercentage}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <p className="text-xs">
                            {`PROGRESS ${progressBarActivities.userProgressCount}/${progressBarActivities.scopedActivitiesCount}`}
                        </p>
                    </div>
                )}
            </CardBody>
        </Card>

    );
}

