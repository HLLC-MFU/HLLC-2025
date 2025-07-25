import { PretestAnswer } from "@/types/pretestAnswer";
import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import { useCallback } from "react";

type PretestAnswerTableProp = {
    PretestAnswers: PretestAnswer[];
};

export default function PretestAnswerTable({ PretestAnswers }: PretestAnswerTableProp) {
    const questions = PretestAnswers.length > 0 ? PretestAnswers[0].answers.map(a => a.pretest) : [];

    // CSV Export function
    const handleExportCSV = useCallback(() => {
        if (PretestAnswers.length === 0) return;
        const headers = [
            "Student ID",
            "Name",
            "School",
            "Major",
            ...questions.map(q => q.question.en || q.question.th || "Question")
        ];
        const rows = PretestAnswers.map(answer => {
            const row = [
                answer.user?.username || '-',
                (answer.user?.name.first && answer.user.name.last) ? `${answer.user.name.first} ${answer.user.name.last}` : '-',
                (answer.user?.metadata?.major?.school && typeof answer.user.metadata.major.school === 'object' && (answer.user.metadata.major.school.name?.en || answer.user.metadata.major.school.name?.th)) || '-',
                answer.user?.metadata?.major?.name?.en ?? answer.user?.metadata?.major?.name?.th ?? '-',
                ...questions.map(q => {
                    const ans = answer.answers.find(a => a.pretest._id === q._id);
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
        link.setAttribute("download", "pretest_answers.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [PretestAnswers, questions]);

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
            <Table aria-label="Pretest Answer Table">
                <TableHeader>
                    <>
                        <TableColumn className="bg-transparent">Student ID</TableColumn>
                        <TableColumn className="bg-transparent">Name</TableColumn>
                        <TableColumn className="bg-transparent">School</TableColumn>
                        <TableColumn className="bg-transparent">Major</TableColumn>
                        {questions.map((q) => (
                            <TableColumn key={q._id} className="break-words whitespace-normal max-w-[200px] bg-transparent">
                                {q.question.en || q.question.th || 'Question'}
                            </TableColumn>
                        ))}
                    </>
                </TableHeader>

                <TableBody emptyContent="No answers found." items={PretestAnswers}>
                    {(answer) => (
                        <TableRow key={answer._id} className="border-b-1 border-t-1 border-gay-400">
                            {[
                                <TableCell key="username">{answer.user?.username || '-'}</TableCell>,
                                <TableCell key="name">
                                    {answer.user?.name.first && answer.user.name.last ? `${answer.user.name.first} ${answer.user.name.last}` : '-'}
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
                                    const ans = answer.answers.find(a => a.pretest._id === q._id);
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