import { PretestAnswer, PretestAverage } from "@/types/pretestAnswer";
import PretestAverageTable from "./PretestAverageTable";
import PretestStatCard from "./PretestStatCard";
import PretestAnswerTable from "./PretestAnswerTable";
import { Divider } from "@heroui/react";

type ListPretestProps = {
    pretestAverage: PretestAverage[];
    pretestAnswers: PretestAnswer[];
};

export default function ListPretest({ pretestAverage, pretestAnswers }: ListPretestProps) {
    return (
        <div className="flex-col flex gap-6 w-full">
            <PretestStatCard pretestAnswer={pretestAverage} />
            <PretestAverageTable />
            <Divider />
            <PretestAnswerTable PretestAnswers={pretestAnswers} />
        </div>
    );
}
