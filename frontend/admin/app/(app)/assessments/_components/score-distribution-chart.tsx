import { Card, CardHeader, CardBody, Divider } from "@heroui/react";
import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ScoreDistribution, AssessmentType, TransformedAnswer, RawPretestAnswer, RawPosttestAnswer } from "@/types/assessment";
import { useEffect, useState } from "react";
import { apiRequest } from "@/utils/api";
import { transformPretestAnswers, transformPosttestAnswers, calculateScoreDistribution } from "./utils/assessment-utils";

interface ScoreDistributionChartProps {
    type: AssessmentType;
}

interface ApiResponse<T> {
    data: {
        data: T[];
    };
    message: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border rounded shadow-sm">
                <p className="font-medium">Score {label}</p>
                <p className="text-primary">{payload[0].value}% of responses</p>
            </div>
        );
    }
    return null;
};

export function ScoreDistributionChart({ type }: ScoreDistributionChartProps) {
    const [data, setData] = useState<ScoreDistribution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const endpoint = type === 'pretest' ? '/pretest-answers' : '/posttest-answers';
                const response = await apiRequest<ApiResponse<RawPretestAnswer | RawPosttestAnswer>>(endpoint);
                
                if (response.data?.data) {
                    const answers = (response.data as unknown as { data: Array<RawPretestAnswer | RawPosttestAnswer> }).data;
                    const transformedAnswers = type === 'pretest' 
                        ? transformPretestAnswers(answers.filter((a): a is RawPretestAnswer => 
                            'pretest' in (a.answers[0] as { pretest?: string; posttest?: string })))
                        : transformPosttestAnswers(answers.filter((a): a is RawPosttestAnswer => 
                            'posttest' in (a.answers[0] as { pretest?: string; posttest?: string })));
                    
                    const distribution = calculateScoreDistribution(transformedAnswers);
                    setData(distribution);
                }
            } catch (error) {
                console.error(`Error fetching ${type} answers:`, error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [type]);

    if (loading) {
        return (
            <Card>
                <CardHeader className="flex items-center gap-2 pb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Score Distribution (%)</h3>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="h-[300px] flex items-center justify-center">
                        <p>Loading...</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex items-center gap-2 pb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">{type === 'pretest' ? 'Pretest' : 'Posttest'} Score Distribution (%)</h3>
            </CardHeader>
            <Divider />
            <CardBody>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="range" 
                                label={{ value: 'Score', position: 'insideBottom', offset: -5 }} 
                            />
                            <YAxis 
                                label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                                domain={[0, 100]}
                            />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="#0070F0" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardBody>
        </Card>
    );
} 