import { PretestAnswer } from "@/types/pretestAnswer";
import { PrepostQuestions } from "@/types/prepostQuestion";
import { apiRequest } from "@/utils/api";
import { useState, useEffect } from "react";
import { PosttestAnswer } from "@/types/posttestAnswer";

export function usePrepostQuestion() {
    const [prepostQuestion, setPrepostQuestion] = useState<PrepostQuestions[]>([]);
    const [pretestAnswers, setPretestAnswers] = useState<
        PretestAnswer[]
    >([]);
    const [posttestAnswers, setPosttestAnswers] = useState<
        PosttestAnswer[]
    >([]);
    const [pretestAnswersInput, setPretestAnswersInput] = useState<
        { pretest: string; answer: string }[]
    >([]);

    const [posttestAnswersInput, setPosttestAnswersInput] = useState<
        { posttest: string; answer: string }[]
    >([]);
    const [hasPretestAnswers, setHasPretestAnswers] = useState<boolean | null>(null);
    const [hasPosttestAnswers, setHasPosttestAnswers] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrepostQuestion = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: PrepostQuestions[] }>(
                '/prepost-questions',
                'GET',
            );

            setPrepostQuestion(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message ||
                    'Failed to fetch question.'
                    : 'Failed to fetch question.',
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchPretestAnswers = async () => {
        setLoading(true);
        try {
            const res = await apiRequest<{ data: boolean }>('/pretest-answers/user', 'GET');
            setHasPretestAnswers(res.data?.data ?? false);
        } catch (err) {
            setHasPretestAnswers(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchPosttestAnswers = async () => {
        setLoading(true);
        try {
            const res = await apiRequest<{ data: boolean }>('/posttest-answers/user', 'GET');
            setHasPosttestAnswers(res.data?.data ?? false);

        } catch (err) {
            setHasPosttestAnswers(false);
        } finally {
            setLoading(false);
        }
    };

    const createPretestAnswers = async (
        answerData: Partial<PretestAnswer>,
    ) => {
        try {
            setLoading(true);
            const res = await apiRequest<PretestAnswer>(
                '/pretest-answers',
                'POST',
                answerData,
            );

            if (res.data) {
                await new Promise(resolve => {
                    setPretestAnswers(prev => {
                        const updated = [...prev, res.data as PretestAnswer];

                        resolve(updated);

                        return updated;
                    });
                });
            }

            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to create answers.');
        } finally {
            setLoading(false);
        }
    };

    const createPosttestAnswers = async (
        answerData: Partial<PosttestAnswer>,
    ) => {
        try {
            setLoading(true);
            const res = await apiRequest<PosttestAnswer>(
                '/posttest-answers',
                'POST',
                answerData,
            );

            if (res.data) {
                await new Promise(resolve => {
                    setPosttestAnswers(prev => {
                        const updated = [...prev, res.data as PosttestAnswer];

                        resolve(updated);

                        return updated;
                    });
                });
            }

            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to create answers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrepostQuestion();
        fetchPretestAnswers();
        fetchPosttestAnswers();
    }, []);

    return {
        prepostQuestion,
        pretestAnswers,
        posttestAnswers,
        hasPretestAnswers,
        hasPosttestAnswers,
        pretestAnswersInput,
        setPretestAnswersInput,
        posttestAnswersInput,
        setPosttestAnswersInput,
        loading,
        error,
        fetchPrepostQuestion,
        fetchPretestAnswers,
        fetchPosttestAnswers,
        createPretestAnswers,
        createPosttestAnswers,
    };
}
