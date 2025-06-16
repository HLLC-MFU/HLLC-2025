import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { User } from '@/types/user';

interface PretestAnswer {
    _id: string;
    user: string;
    answers: Array<{
        pretest: string;
        answer: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface PosttestAnswer {
    _id: string;
    user: string;
    answers: Array<{
        posttest: string;
        answer: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface Statistics {
    totalStudents: number;
    completionRate: number;
    averageScore: number;
    averageTimeSpent: number;
}

export function useStatistics() {
    const [stats, setStats] = useState<Statistics>({
        totalStudents: 0,
        completionRate: 0,
        averageScore: 0,
        averageTimeSpent: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch users
                const usersRes = await apiRequest<{ data: User[] }>('/users?limit=0', 'GET');
                const users = usersRes.data?.data || [];
                
                // Count students (users with role "Student")
                const totalStudents = users.filter(user => user.role?.name === 'Student').length;

                // Fetch pretest and posttest answers
                const [pretestRes, posttestRes] = await Promise.all([
                    apiRequest<{ data: PretestAnswer[] }>('/pretest-answers?limit=0', 'GET'),
                    apiRequest<{ data: PosttestAnswer[] }>('/posttest-answers?limit=0', 'GET')
                ]);

                const pretestAnswers = pretestRes.data?.data || [];
                const posttestAnswers = posttestRes.data?.data || [];

                // Calculate completion rate (students who completed both tests)
                const uniqueStudentsWithAnswers = new Set([
                    ...pretestAnswers.map(a => a.user),
                    ...posttestAnswers.map(a => a.user)
                ]);
                const completionRate = totalStudents > 0 
                    ? (uniqueStudentsWithAnswers.size / totalStudents) * 100 
                    : 0;

                // Calculate average score (placeholder - you might want to implement actual scoring logic)
                const totalAnswers = [...pretestAnswers, ...posttestAnswers].length;
                const averageScore = totalAnswers > 0 
                    ? (totalAnswers / (uniqueStudentsWithAnswers.size * 2)) * 100 
                    : 0;

                // Calculate average time spent (placeholder - you might want to implement actual time calculation)
                const averageTimeSpent = 30; // Placeholder value in minutes

                setStats({
                    totalStudents,
                    completionRate,
                    averageScore,
                    averageTimeSpent
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    return { stats, loading, error };
} 