import { PotestAverage } from "@/types/posttestAnswer";
import { Card, CardHeader, CardBody } from "@heroui/react";

type PosttestStatCardProps = {
    posttestAnswer: PotestAverage[];
};

function formatAverage(value: number) {
    return value.toFixed(2);
}

export default function PosttestStatCard({ posttestAnswer }: PosttestStatCardProps) {
    const posttestData = posttestAnswer.map((item, index) => ({
        id: index + 1,
        question: item.posttest.question.en || item.posttest.question.th || 'Unnamed',
        count: item.count,
        average: item.average,
    }));

    const totalResponses = Math.max(...posttestData.map(p => p.count), 0);
    const overallAverage = posttestData.reduce((sum, item) => sum + item.average, 0) / (posttestData.length || 1);
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
                        <div className="text-sm font-medium text-muted-foreground">Overall Posttest Average</div>
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
                        <div className="text-2xl font-bold">{posttestData.length}</div>
                    </CardBody>
                </Card>
            </div>
        </>
    )
} 