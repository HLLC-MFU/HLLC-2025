import PretestAverageTable from "./PretestAverageTable";
import PretestStatCard from "./PretestStatCard";

import { PretestAnswer, PretestAverage } from "@/types/pretestAnswer";



type ListPretestProps = {
    pretestAverage: PretestAverage[];
    pretestAnswers: PretestAnswer[];
};

export default function ListPretest({ pretestAverage, pretestAnswers }: ListPretestProps) {
    return (
        <div className="flex-col flex gap-6 w-full">
            <PretestStatCard pretestAnswer={pretestAverage} />
            <PretestAverageTable />
            {/* <Divider />
            <PretestAnswerTable PretestAnswers={pretestAnswers} /> */}
        </div>
    );
}
