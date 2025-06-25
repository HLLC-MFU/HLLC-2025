import { TestAnswer, ScoreDistribution, DifficultyDistribution, QuestionTypeDistribution, StudentDetail, UserDetails, Question, RawPretestAnswer, RawPosttestAnswer, TransformedAnswer, UserInAnswer } from "@/types/assessment";

export function calculateAverageScore(answers: TransformedAnswer[]): number {
    if (answers.length === 0) return 0;
    const scores = answers.map(a => {
        if (typeof a.answer === 'number') return a.answer;
        if (Array.isArray(a.answer)) return a.answer.length;
        return 0;
    });
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
}

export function calculateCompletionRate(answers: TransformedAnswer[]): number {
    if (answers.length === 0) return 0;
    const uniqueUsers = new Set(answers.map(a => a.userId)).size;
    const expectedAnswers = uniqueUsers * 10; // Assuming each user should answer 10 questions
    return Math.round((answers.length / expectedAnswers) * 100);
}

export function calculateAverageTimeSpent(answers: TransformedAnswer[]): number {
    if (answers.length === 0) return 0;
    const times = answers.map(a => {
        const created = new Date(a.createdAt).getTime();
        const updated = new Date(a.updatedAt).getTime();
        return (updated - created) / (1000 * 60); // Convert to minutes
    });
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

export function calculateScoreDistribution(answers: TransformedAnswer[]): ScoreDistribution[] {
    const scoreCounts = new Map<number, number>();
    let totalAnswers = 0;

    // Initialize counts for scores 1 to 5
    for (let i = 1; i <= 5; i++) {
        scoreCounts.set(i, 0);
    }

    // Count all answers
    answers.forEach(answer => {
        const score = parseFloat(answer.answer);
        if (!isNaN(score) && score >= 1 && score <= 5) {
            scoreCounts.set(score, (scoreCounts.get(score) || 0) + 1);
            totalAnswers++;
        }
    });

    // Convert counts to percentages and create ScoreDistribution array
    return Array.from(scoreCounts.entries())
        .map(([score, count]) => ({
            range: score.toString(),
            count: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0
        }))
        .sort((a, b) => parseInt(a.range) - parseInt(b.range));
}

export function calculateStudentDetails(answers: TransformedAnswer[], questions: Question[]): StudentDetail[] {
    const userDetails = new Map<string, UserDetails & { 
        skillRatings: Record<string, number | string>;
        answeredQuestions: Set<string>;
        totalQuestions: number;
    }>();

    // First, count total questions for each user
    answers.forEach(answer => {
        const userId = answer.user?.username || answer.userId;
        const details = userDetails.get(userId) || {
            userId,
            name: answer.user?.name || "N/A",
            school: answer.user?.school,
            major: answer.user?.major,
            scores: [] as number[],
            timeSpent: [] as number[],
            answerCount: 0,
            lastUpdated: new Date(answer.updatedAt),
            skillRatings: {} as Record<string, number | string>,
            answeredQuestions: new Set<string>(),
            totalQuestions: 0
        };

        // Add question to answered set if there's an answer
        if (answer.answer !== undefined && answer.answer !== null) {
            details.answeredQuestions.add(answer.questionId);
        }

        // Update total questions count
        const question = questions.find(q => q._id === answer.questionId);
        if (question) {
            details.totalQuestions = Math.max(details.totalQuestions, questions.length);
        }

        const score = typeof answer.answer === 'number' ? answer.answer :
                     Array.isArray(answer.answer) ? answer.answer.length : 0;
        details.scores.push(score);

        const timeSpent = (new Date(answer.updatedAt).getTime() - new Date(answer.createdAt).getTime()) / (1000 * 60);
        details.timeSpent.push(timeSpent);
        details.answerCount++;

        // Add skill rating if question exists and answer is available
        if (question && (typeof answer.answer === 'number' || typeof answer.answer === 'string')) {
            details.skillRatings[question.question.en] = answer.answer;
        }

        const answerDate = new Date(answer.updatedAt);
        if (answerDate > details.lastUpdated) {
            details.lastUpdated = answerDate;
        }

        userDetails.set(userId, details);
    });

    return Array.from(userDetails.values()).map(details => ({
        userId: details.userId,
        username: details.userId,
        name: typeof details.name === 'object' ? 
            `${details.name.first} ${details.name.middle || ''} ${details.name.last}`.trim() : 
            details.name,
        school: details.school,
        major: details.major,
        score: Math.round((details.scores.reduce((a, b) => a + b, 0) / details.scores.length) * 100),
        timeSpent: Math.round(details.timeSpent.reduce((a, b) => a + b, 0) / details.timeSpent.length),
        completed: details.answeredQuestions.size > 0, // Changed to check if user has any answers
        completedQuestions: details.answeredQuestions.size,
        totalQuestions: details.totalQuestions,
        lastUpdated: details.lastUpdated,
        skillRatings: details.skillRatings
    }));
}

export function calculateDifficultyDistribution(answers: TransformedAnswer[], questions: Question[]): DifficultyDistribution {
    const difficulties = answers.reduce((acc, curr) => {
        const question = questions.find(q => q._id === curr.questionId);
        const difficulty = question?.difficulty || "medium";
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        easy: difficulties.easy || 0,
        medium: difficulties.medium || 0,
        hard: difficulties.hard || 0
    };
}

export function calculateQuestionTypeDistribution(answers: TransformedAnswer[], questions: Question[]): QuestionTypeDistribution {
    const types = answers.reduce((acc, curr) => {
        const question = questions.find(q => q._id === curr.questionId);
        const type = question?.type || "text";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        text: types.text || 0,
        rating: types.rating || 0,
        dropdown: types.dropdown || 0,
        checkbox: types.checkbox || 0,
        radio: types.radio || 0
    };
}

export function getProgressColor(value: number): "success" | "warning" | "danger" {
    if (value >= 70) return "success";
    if (value >= 40) return "warning";
    return "danger";
}

export function getDifficultyColor(difficulty: string): "success" | "warning" | "danger" | "default" {
    switch (difficulty) {
        case "easy":
            return "success";
        case "medium":
            return "warning";
        case "hard":
            return "danger";
        default:
            return "default";
    }
}

export const QUESTION_TYPE_COLORS: Record<string, "primary" | "success" | "warning" | "danger" | "secondary"> = {
    text: "primary",
    rating: "success",
    dropdown: "warning",
    checkbox: "danger",
    radio: "secondary"
};

export function transformRawAnswersToTestAnswers(
    pretestAnswers: TransformedAnswer[],
    posttestAnswers: TransformedAnswer[],
    questions: Question[]
): TransformedAnswer[] {
    // Combine and sort all answers by createdAt
    const allAnswers = [...pretestAnswers, ...posttestAnswers ].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get unique user IDs
    const uniqueUserIds = Array.from(new Set(allAnswers.map(answer => answer.userId)));

    // Transform answers for each user
    return uniqueUserIds.flatMap(userId => {
        const userAnswers = allAnswers.filter(answer => answer.userId === userId);
        const latestAnswer = userAnswers[0]; // Most recent answer

        if (!latestAnswer) return [];

        // Get all questions for this user
        const userQuestions = questions.filter(q => 
            userAnswers.some(a => a.questionId === q._id)
        );

        // Calculate completion status
        const completedQuestions = userQuestions.filter(q => 
            userAnswers.some(a => a.questionId === q._id)
        ).length;

        const isCompleted = completedQuestions === userQuestions.length;

        // Transform each answer
        return userAnswers.map(answer => ({
            ...answer,
            user: {
                ...answer.user,
                name: typeof answer.user?.name === 'object' ? 
                    `${answer.user.name.first} ${answer.user.name.middle || ''} ${answer.user.name.last}`.trim() : 
                    answer.user?.name || '',
                school: answer.user?.metadata?.major?.school?.name?.en || '',
                major: answer.user?.metadata?.major?.name?.en || ''
            }
        }));
    });
}

function transformUserData(user: UserInAnswer) {
    return {
        _id: user._id,
        name: user.name,
        username: user.username,
        userType: user.role,
        metadata: { major: user.metadata.major },
        school: user.metadata.major?.school?.name?.en || '',
        major: user.metadata.major?.name?.en || ''
    };
}

export function transformPretestAnswers(answers: RawPretestAnswer[]): TransformedAnswer[] {
    return answers.flatMap(answer => 
        answer.answers.map(ans => ({
            _id: answer._id,
            userId: answer.user._id,
            questionId: ans.pretest,
            answer: ans.answer,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
            user: transformUserData(answer.user)
        }))
    );
}

export function transformPosttestAnswers(answers: RawPosttestAnswer[]): TransformedAnswer[] {
    return answers.flatMap(answer => 
        answer.answers.map(ans => ({
            _id: answer._id,
            userId: answer.user._id,
            questionId: ans.posttest,
            answer: ans.answer,
            createdAt: answer.createdAt,
            updatedAt: answer.updatedAt,
            user: transformUserData(answer.user)
        }))
    );
} 