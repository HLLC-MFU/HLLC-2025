import { useCallback, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { Name } from '@/types/checkin';

type userAnswers = {
    userId: string;
    name: Name;
    answers: { questionId: string; answer: string }[];
}

type average = {
    questionId: string;
    average: number;
    question: { th: string; en: string };
}

type PretestDetailResponse = {
    average: average[];
    userAnswers: userAnswers[];
    totalAnswers: number;
}

export function usePretestDetail() {
    const [averageData, setAverageData] = useState<average[]>([]);
    const [userAnswersData, setUserAnswersData] = useState<userAnswers[]>([]);
    const [totalAnswers, setTotalAnswers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPretestDetail = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiRequest<PretestDetailResponse>(`/dashboard/pretest-answers`, "GET");
            const data = response.data;

            setAverageData(data?.average || []);
            setUserAnswersData(data?.userAnswers || []);
            setTotalAnswers(data?.totalAnswers || 0);
        } catch (error) {
            console.error("Error fetching pretest detail:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    const userAnswers = () => {
        return userAnswersData;
    };

    return {
        fetchPretestDetail,
        averageData,
        totalAnswers,
        userAnswers,
        isLoading,
    };
}
