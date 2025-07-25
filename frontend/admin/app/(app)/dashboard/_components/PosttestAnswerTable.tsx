import { PottestAnswer } from "@/types/posttestAnswer";
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import { useCallback } from "react";

type PosttestAnswerTableProp = {
    PosttestAnswers: PottestAnswer[];
};

export default function PosttestAnswerTable({ PosttestAnswers }: PosttestAnswerTableProp) {
    const questions = PosttestAnswers.length > 0 ? PosttestAnswers[0].answers.map(a => a.posttest) : [];

    // CSV Export function
    const handleExportCSV = useCallback(() => {
        if (PosttestAnswers.length === 0) return;
        const headers = [
            "Student ID",
            "Name",
            "School",
            "Major",
            ...questions.map(q => q.question?.en || q.question?.th || "Question")
        ];
        const rows = PosttestAnswers.map(answer => {
            const row = [
                answer.user?.username || '-',
                (answer.user?.name?.first && answer.user?.name?.last) ? `${answer.user.name.first} ${answer.user.name.last}` : '-',
                (answer.user?.metadata?.major?.school && typeof answer.user.metadata.major.school === 'object' && (answer.user.metadata.major.school.name?.en || answer.user.metadata.major.school.name?.th)) || '-',
                answer.user?.metadata?.major?.name?.en ?? answer.user?.metadata?.major?.name?.th ?? '-',
                ...questions.map(q => {
                    const ans = answer.answers.find(a => a.posttest._id === q._id);
                    return ans ? ans.answer : '-';
                })
            ];
            return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",");
        });
        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "posttest_answers.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [PosttestAnswers, questions]);

    return (
        <>
            <div className="flex justify-end mb-2">
                <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/80 transition"
                >
                    Export CSV
                </button>
            </div>
            <Table aria-label="Posttest Answer Table">
                <TableHeader>
                    <>
                        <TableColumn className="bg-transparent">Student ID</TableColumn>
                        <TableColumn className="bg-transparent">Name</TableColumn>
                        <TableColumn className="bg-transparent">School</TableColumn>
                        <TableColumn className="bg-transparent">Major</TableColumn>
                        {questions.map((q) => (
                            <TableColumn key={q._id} className="break-words whitespace-normal max-w-[200px] bg-transparent">
                                {q.question?.en || q.question?.th || 'Question'}
                            </TableColumn>
                        ))}
                    </>
                </TableHeader>

                <TableBody emptyContent="No answers found." items={PosttestAnswers}>
                    {(answer) => (
                        <TableRow key={answer._id} className="border-b-1 border-t-1 border-gay-400">
                            {[
                                <TableCell key="username">{answer.user?.username || '-'}</TableCell>,
                                <TableCell key="name">
                                    {answer.user?.name?.first && answer.user?.name?.last ? `${answer.user.name.first} ${answer.user.name.last}` : '-'}
                                </TableCell>,
                                <TableCell key="school">
                                    {answer.user?.metadata?.major?.school &&
                                        typeof answer.user.metadata.major.school === 'object' &&
                                        (answer.user.metadata.major.school.name?.en ||
                                            answer.user.metadata.major.school.name?.th) || '-'}
                                </TableCell>,

                                <TableCell key="major">
                                    {answer.user?.metadata?.major?.name?.en ??
                                        answer.user?.metadata?.major?.name?.th ??
                                        '-'}
                                </TableCell>,
                                ...questions.map((q) => {
                                    const ans = answer.answers.find(a => a.posttest._id === q._id);
                                    return (
                                        <TableCell key={q._id}>
                                            {ans ? ans.answer : '-'}
                                        </TableCell>
                                    );
                                }),
                            ]}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </>
    );
} 