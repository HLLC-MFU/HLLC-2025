import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/utils/api';
import { Question } from '@/types/assessment';
import {
  AssessmentAnswer,
  AssessmentAnswerResponse,
  QuestionSummaryResponse,
  ExtendedStudentDetail,
  QuestionStat,
} from '../types/activity-dashboard.types';
import { transformRawAnswersToTestAnswers } from '../utils/assessment-utils';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const apiCache = new Map<string, { data: any; timestamp: number }>();

async function fetchWithCache<T>(
  endpoint: string,
): Promise<{ data: T; message?: string }> {
  const now = Date.now();
  const cached = apiCache.get(endpoint);

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await apiRequest<T>(endpoint);
    if (!response?.data) {
      console.warn(`No data received from API endpoint: ${endpoint}`);
      return { data: [] as unknown as T, message: 'No data received' };
    }

    const transformedResponse = {
      data: response.data,
      message: response.message || 'Success',
    };

    apiCache.set(endpoint, { data: transformedResponse, timestamp: now });
    return transformedResponse;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    return {
      data: [] as unknown as T,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function transformUserData(user: any) {
  const fallbackMajor = {
    _id: '',
    name: { th: '', en: '' },
    school: { name: { th: '', en: '' } },
  };

  const major = user.metadata?.major
    ? {
        _id: user.metadata.major._id || '',
        name: {
          th: user.metadata.major.name?.th || '',
          en: user.metadata.major.name?.en || '',
        },
        school: user.metadata.major.school
          ? {
              name: {
                th: user.metadata.major.school.name?.th || '',
                en: user.metadata.major.school.name?.en || '',
              },
            }
          : { name: { th: '', en: '' } },
      }
    : fallbackMajor;

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    userType: user.role,
    metadata: { major },
    school: major.school?.name?.en || '',
    major: major.name?.en || '',
  };
}

function transformAssessmentAnswers(answers: AssessmentAnswer[]) {
  return answers.flatMap((answer) =>
    answer.answers.map((ans) => ({
      _id: answer._id,
      userId: answer.user._id,
      questionId: ans.assessment,
      answer: ans.answer,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
      user: transformUserData(answer.user),
    })),
  );
}

function calculateStudentDetails(
  answers: any[],
  questionSummaryData: QuestionSummaryResponse[],
): ExtendedStudentDetail[] {
  const studentMap = new Map<string, ExtendedStudentDetail>();
  const questionNameMap = new Map(
    questionSummaryData.map((item) => [
      item.assessment._id,
      item.assessment.question.en,
    ]),
  );

  answers.forEach((answer) => {
    const questionLabel =
      questionNameMap.get(answer.questionId) || `Question ${answer.questionId}`;
    const rawAnswer = answer.answer;
    const isNumeric = !isNaN(parseFloat(rawAnswer)) && isFinite(rawAnswer);
    const parsedAnswer = isNumeric ? parseFloat(rawAnswer) : rawAnswer;

    const existing = studentMap.get(answer.userId);

    if (existing) {
      existing.completedQuestions++;
      existing.totalQuestions++;

      // อัปเดต score เฉพาะกรณีเป็นตัวเลข
      if (typeof parsedAnswer === 'number') {
        existing.score = Math.round((existing.score + parsedAnswer) / 2);
      }

      existing.skillRatings = {
        ...existing.skillRatings,
        [questionLabel]: parsedAnswer,
      };
    } else {
      studentMap.set(answer.userId, {
        userId: answer.userId,
        username: answer.user.username,
        name:
          typeof answer.user.name === 'object'
            ? `${answer.user.name.first} ${answer.user.name.middle || ''} ${answer.user.name.last}`.trim()
            : answer.user.name,
        userType: answer.user.userType,
        school: answer.user.school,
        major: answer.user.major,
        completed: true,
        score: typeof parsedAnswer === 'number' ? parsedAnswer : 0,
        timeSpent: 0,
        completedQuestions: 1,
        totalQuestions: 1,
        lastUpdated: new Date(answer.updatedAt),
        skillRatings: {
          [questionLabel]: parsedAnswer,
        },
      });
    }
  });

  return Array.from(studentMap.values());
}

export function useActivityData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<
    AssessmentAnswer[]
  >([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionSummaryData, setQuestionSummaryData] = useState<
    QuestionSummaryResponse[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [answersResult, questionsResult, summaryResult] =
          await Promise.all([
            apiRequest<AssessmentAnswerResponse>('/assessment-answers'),
            apiRequest<{ data: Question[] }>('/prepost-questions'),
            fetchWithCache<QuestionSummaryResponse[]>(
              '/assessment-answers/all/average',
            ),
          ]);

        if (answersResult.data?.data) {
          setAssessmentAnswers(answersResult.data.data);
        }
        if (questionsResult.data?.data) {
          setQuestions(questionsResult.data.data);
        }
        if (summaryResult.data) {
          setQuestionSummaryData(summaryResult.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // console.log('questionSummaryData', questionSummaryData);
  // console.log('assessmentAnswers', assessmentAnswers);
  // console.log('questions', questions);

  const transformedAnswers = useMemo(() => {
    if (!assessmentAnswers.length || !questions.length) return [];
    const answers = transformAssessmentAnswers(assessmentAnswers);
    return transformRawAnswersToTestAnswers(answers, [], questions);
  }, [assessmentAnswers, questions]);

  const studentDetails = useMemo(() => {
    if (!transformedAnswers.length || !questionSummaryData.length) return [];
    return calculateStudentDetails(transformedAnswers, questionSummaryData);
  }, [transformedAnswers, questionSummaryData]);

  const questionStats = useMemo(() => {
    if (!questionSummaryData?.length) return [];

    return questionSummaryData
      .map((item) => ({
        _id: item.assessment._id,
        type: item.assessment.type as QuestionStat['type'],
        displayType: 'both' as QuestionStat['displayType'],
        question: item.assessment.question,
        order: item.assessment.order || 0,
        banner: null,
        createdAt: item.assessment.createdAt,
        updatedAt: item.assessment.updatedAt,
        averageScore: item.average || 0,
        totalAnswers: item.count || 0,
      }))
      .filter((item): item is QuestionStat => item !== null)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [questionSummaryData]);

  return {
    loading,
    error,
    studentDetails,
    questionStats,
  };
}
