import { ExtendedStudentDetail } from '../types/activity-dashboard.types';

export function exportToCSV(studentDetails: ExtendedStudentDetail[]) {
    const dataToExport = studentDetails.map(student => ({
        "Student ID": student.userId,
        "Name": student.name || "N/A",
        "School": student.school || "N/A",
        "Major": student.major || "N/A",
        "Submit": student.completed ? "Completed" : "In Progress",
        "Average Score": `${student.score}%`,
        "Completed Questions": student.completedQuestions,
        "Total Questions": student.totalQuestions,
        "Last Updated": student.lastUpdated.toLocaleDateString(),
        ...student.skillRatings
    }));

    const headers = Object.keys(dataToExport[0]);
    const csv = [
        headers.join(","),
        ...dataToExport.map(row => headers.map(header => (row as Record<string, any>)[header]).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "activity_student_details.csv";
    link.click();
} 