import { useState, useEffect } from 'react';
import { addToast } from '@heroui/react';
import { 
    Question, 
    AssessmentResult, 
    AssessmentStats, 
    TestAnswer, 
    TestAnswersResponse,
    PreTestState 
} from '@/types/assessment';
import { apiRequest } from '@/utils/api';

// Initial state
const initialState: PreTestState = {
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

export function usePreTest() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [results, setResults] = useState<AssessmentResult[]>([]);
    const [stats, setStats] = useState<AssessmentStats>(initialState.stats);
    const [answers, setAnswers] = useState<TestAnswer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch all pre-test questions from the API.
     * @return {Promise<void>} A promise that resolves when the questions are fetched.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Question[] }>('/pre-tests');

            if (res.data?.data) {
                setQuestions(Array.isArray(res.data.data) ? res.data.data : []);
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
     * Fetch all pretest answers from the API.
     * @return {Promise<void>} A promise that resolves when the answers are fetched.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const fetchAnswers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<TestAnswersResponse>('/pre-test-answers');

            if (res.data?.data) {
                setAnswers(Array.isArray(res.data.data) ? res.data.data : []);
            } else {
                throw new Error(res.message || 'Failed to fetch answers');
            }
        } catch (err) {
            addToast({
                title: 'Failed to fetch pretest answers. Please try again.',
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
     * Creates a new pre-test question.
     * @param {Partial<Question>} questionData - The data for the new question.
     * @return {Promise<void>} A promise that resolves when the question is created.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
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

            // Create FormData
            const form = new FormData();

            // Add basic fields with proper type conversion
            form.append('type', questionData.type);
            form.append('order', String(Number(questionData.order)));
            form.append('status', 'active');

            // Add nested question object with trimmed values
            form.append('question[en]', questionData.question.en.trim());
            form.append('question[th]', questionData.question.th.trim());

            // Add banner if exists and is a File
            if (questionData.banner && typeof questionData.banner === 'object' && 'name' in questionData.banner) {
                form.append('banner', questionData.banner as File);
            }

            // Add timestamps
            const now = new Date().toISOString();
            form.append('createdAt', now);
            form.append('updatedAt', now);

            // Log the exact data being sent
            console.log('Creating question with FormData:', {
                url: '/pre-tests',
                method: 'POST',
                formData: Object.fromEntries(form.entries()),
                rawData: questionData,
            });

            const res = await apiRequest<{ data: Question }>('/pre-tests', 'POST', form);

            // Log the complete response for debugging
            console.log('Create question response:', {
                status: res.statusCode,
                message: res.message,
                data: res.data,
            });

            if (res.statusCode === 401) {
                throw new Error('Your session has expired. Please log in again.');
            }

            if (res.statusCode === 400) {
                console.error('Validation errors:', res.data);
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
                console.error('Unexpected response format:', res);
                throw new Error(res.message || 'Failed to create question: Invalid response format');
            }
        } catch (err) {
            console.error('Create question error:', {
                error: err,
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
                data: questionData,
            });

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
     * Updates an existing pre-test question.
     * @param {string} questionId - The ID of the question to update.
     * @param {Partial<Question>} questionData - The data to update the question with.
     * @return {Promise<void>} A promise that resolves when the question is updated.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
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

            // Create FormData
            const form = new FormData();

            // Add basic fields
            if (questionData.type) form.append('type', questionData.type);
            if (questionData.order !== undefined) form.append('order', String(questionData.order));

            // Add nested question object
            if (questionData.question) {
                form.append('question[en]', questionData.question.en.trim());
                form.append('question[th]', questionData.question.th.trim());
            }

            // Add banner if exists
            if (questionData.banner) {
                form.append('banner', questionData.banner);
            }

            // Add timestamp
            form.append('updatedAt', new Date().toISOString());

            console.log('Updating question with FormData:', {
                url: `/pre-tests/${questionId}`,
                method: 'PATCH',
                formData: Object.fromEntries(form.entries()),
            });

            const res = await apiRequest<{ data: Question }>(`/pre-tests/${questionId}`, 'PATCH', form);

            console.log('Update question response:', {
                status: res.statusCode,
                message: res.message,
                data: res.data,
            });

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
                console.error('Unexpected response format:', res);
                throw new Error(res.message || 'Failed to update question: Invalid response format');
            }
        } catch (err) {
            console.error('Update question error:', {
                error: err,
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
            });

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
     * Deletes a pre-test question.
     * @param {string} questionId - The ID of the question to delete.
     * @return {Promise<void>} A promise that resolves when the question is deleted.
     * @throws {Error} If the API request fails, an error is thrown and the error state is updated.
     */
    const deleteQuestion = async (questionId: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const res = await apiRequest<{ data: { id: string } }>(`/pre-tests/${questionId}`, 'DELETE');

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

    // Fetch questions and answers when component mounts
    useEffect(() => {
        fetchQuestions();
        fetchAnswers();
    }, []);

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