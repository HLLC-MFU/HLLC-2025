import { PretestAverage } from "@/types/pretestAnswer";
import { Card, CardHeader, CardBody } from "@heroui/react";

type PretestStatCardProps = {
    pretestAnswer: PretestAverage[];
};

function formatAverage(value: number) {
    return value.toFixed(2);
}

export default function PretestStatCard({ pretestAnswer }: PretestStatCardProps) {
    const pretestData = pretestAnswer.map((item, index) => ({
        id: index + 1,
        question: item.pretest.question.en || item.pretest.question.th || 'Unnamed',
        count: item.count,
        average: item.average,
    }));

    const totalResponses = Math.max(...pretestData.map(p => p.count), 0);
    const overallAverage = pretestData.reduce((sum, item) => sum + item.average, 0) / (pretestData.length || 1);
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="text-sm font-medium text-muted-foreground">Total Responses</div>
                    </CardHeader>
                    <CardBody>
                        <div className="text-2xl font-bold">{totalResponses}</div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="text-sm font-medium text-muted-foreground">Overall Pretest Average</div>
                    </CardHeader>
                    <CardBody>
                        <div className="text-2xl font-bold">
                            {formatAverage(overallAverage)}
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <div className="text-sm font-medium text-muted-foreground">Total Questions</div>
                    </CardHeader>
                    <CardBody>
                        <div className="text-2xl font-bold">{pretestData.length}</div>
                    </CardBody>
                </Card>
            </div>
        </>
    )
}