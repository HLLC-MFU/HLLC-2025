import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { 
    Question, 
    AssessmentResult, 
    AssessmentStats, 
    TestAnswer, 
    TestAnswersResponse,
    AssessmentType
} from '@/types/assessment';
import { apiRequest } from '@/utils/api';

interface PrepostQuestionsState {
    questions: Question[];
    results: AssessmentResult[];
    stats: AssessmentStats;
    answers: TestAnswer[];
}

// Initial state
const initialState: PrepostQuestionsState = {
    questions: [],
    results: [],
    stats: {
        totalQuestions: 0,
        totalAttempts: 0,
        averageScore: 0,
        completionRate: 0,
        averageTimeSpent: 0,
        totalStudents: 0,
        difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
        questionTypeDistribution: { text: 0, rating: 0, dropdown: 0, checkbox: 0, radio: 0 }
    },
    answers: []
};

export function usePrepostQuestions(type: AssessmentType) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [results, setResults] = useState<AssessmentResult[]>([]);
    const [stats, setStats] = useState<AssessmentStats>(initialState.stats);
    const [answers, setAnswers] = useState<TestAnswer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all questions from the API.
     */
    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Question[] }>('/prepost-questions');

            if (res.data?.data) {
                const allQuestions = Array.isArray(res.data.data) ? res.data.data : [];
                setQuestions(allQuestions);
            } else {
                throw new Error(res.message || 'Failed to fetch questions');
            }
        } catch (err) {
            addToast({
                title: 'Failed to fetch questions. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch questions.'
                    : 'Failed to fetch questions.',
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch all answers from the API based on type (pretest/posttest).
     */
    const fetchAnswers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<TestAnswersResponse>(`/prepost-questions/answers?type=${type}`);

            if (res.data?.data) {
                setAnswers(Array.isArray(res.data.data) ? res.data.data : []);
            } else {
                throw new Error(res.message || 'Failed to fetch answers');
            }
        } catch (err) {
            addToast({
                title: `Failed to fetch ${type} answers. Please try again.`,
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch answers.'
                    : 'Failed to fetch answers.',
            );
        } finally {
            setLoading(false);
        }
    };

    /**
     * Creates a new question.
     */
    const createQuestion = async (questionData: Partial<Question>): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!questionData.type || !['text', 'rating', 'dropdown', 'checkbox', 'radio'].includes(questionData.type)) {
                throw new Error('Question type must be one of: text, rating, dropdown, checkbox, radio');
            }
            if (!questionData.question?.en?.trim() || !questionData.question?.th?.trim()) {
                throw new Error('Both English and Thai questions are required and cannot be empty');
            }
            if (typeof questionData.order !== 'number' || questionData.order < 1) {
                throw new Error('Order must be a number and at least 1');
            }

            // Prepare request data
            const requestData = {
                type: questionData.type,
                order: Number(questionData.order),
                status: 'active',
                displayType: questionData.displayType || 'both',
                assessmentType: type,
                question: {
                    en: questionData.question.en.trim(),
                    th: questionData.question.th.trim()
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const res = await apiRequest<{ data: Question }>('/prepost-questions', 'POST', requestData);

            if (res.statusCode === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }

            if (res.statusCode === 400) {
                throw new Error(res.message || 'Invalid question data. Please check all fields.');
            }

            if (res.statusCode >= 400) {
                throw new Error(res.message || `Failed to create question (${res.statusCode})`);
            }

            if (res.data) {
                setQuestions(prev => [...prev, (res.data as unknown as Question)]);
                addToast({
                    title: 'Question created successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to create question: Invalid response format');
            }
        } catch (err) {
            addToast({
                title: err instanceof Error ? err.message : 'Failed to create question. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to create question.'
                    : 'Failed to create question.',
            );
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Updates an existing question.
     */
    const updateQuestion = async (questionId: string, questionData: Partial<Question>): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (questionData.question) {
                if (!questionData.question.en?.trim() || !questionData.question.th?.trim()) {
                    throw new Error('Both English and Thai questions are required');
                }
            }

            // Prepare request data
            const requestData: Record<string, any> = {
                assessmentType: type,
                updatedAt: new Date().toISOString()
            };

            // Add fields only if they are provided
            if (questionData.type) requestData.type = questionData.type;
            if (questionData.order !== undefined) requestData.order = Number(questionData.order);
            if (questionData.displayType) requestData.displayType = questionData.displayType;
            if (questionData.question) {
                requestData.question = {
                    en: questionData.question.en.trim(),
                    th: questionData.question.th.trim()
                };
            }

            const res = await apiRequest<{ data: Question }>(`/prepost-questions/${questionId}`, 'PATCH', requestData);

            if (res.statusCode === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }

            if (res.statusCode >= 400) {
                throw new Error(res.message || `Failed to update question (${res.statusCode})`);
            }

            if (res.data) {
                setQuestions(prev => prev.map(q => q._id === questionId ? (res.data as unknown as Question) : q));
                addToast({
                    title: 'Question updated successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to update question: Invalid response format');
            }
        } catch (err) {
            addToast({
                title: 'Failed to update question. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to update question.'
                    : 'Failed to update question.',
            );
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Deletes a question.
     */
    const deleteQuestion = async (questionId: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const res = await apiRequest<{ data: { id: string } }>(`/prepost-questions/${questionId}`, 'DELETE');

            if (res.statusCode === 200) {
                setQuestions(prev => prev.filter(q => q._id !== questionId));
                addToast({
                    title: 'Question deleted successfully!',
                    color: 'success',
                });
            } else {
                throw new Error(res.message || 'Failed to delete question');
            }
        } catch (err) {
            addToast({
                title: 'Failed to delete question. Please try again.',
                color: 'danger',
            });
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to delete question.'
                    : 'Failed to delete question.',
            );
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Fetch questions and answers when component mounts or type changes
    useEffect(() => {
        fetchQuestions();
        fetchAnswers();
    }, [type]);

    return {
        questions,
        results,
        stats,
        answers,
        loading,
        error,
        fetchQuestions,
        fetchAnswers,
        createQuestion,
        updateQuestion,
        deleteQuestion,
    };
} 