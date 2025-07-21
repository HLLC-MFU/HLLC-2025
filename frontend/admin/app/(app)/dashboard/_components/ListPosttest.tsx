import { PottestAnswer, PotestAverage } from "@/types/posttestAnswer";

import { Divider } from "@heroui/react";
import PosttestStatCard from "./PosttestStatCard";
import PosttestAverageTable from "./PosttestAverageTable";
import PosttestAnswerTable from "./PosttestAnswerTable";

type ListPosttestProps = {
    posttestAverage: PotestAverage[];
    posttestAnswers: PottestAnswer[];
    totalAverageCount: number;
};

export default function ListPosttest({ posttestAverage, posttestAnswers, totalAverageCount }: ListPosttestProps) {
    return (
        <div className="flex-col flex gap-6 w-full">
            <PosttestStatCard posttestAnswer={posttestAverage} />
            <PosttestAverageTable posttestAverage={posttestAverage} totalAverageCount={totalAverageCount} />
            <Divider />
            <PosttestAnswerTable PosttestAnswers={posttestAnswers} />
        </div>
    );
} 