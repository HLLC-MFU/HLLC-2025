export function exportToCsv(data: any[], filename?: string) {
    if (!data || !data.length) {
        alert("No data to export");
        return;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const defaultFilename = `coin_hunting_leaderboard_${day}-${month}-${year}.csv`;
    const finalFilename = filename || defaultFilename;

    const headers = Object.keys(data[0]).filter(h => h !== "userId");

    const csvRows = [
        headers.join(","),
        ...data.map(row =>
            headers
                .map(fieldName => {
                    let value = row[fieldName] ?? "";

                    if (typeof value === "object" && value !== null) {
                        if (fieldName === "name") {
                            const { first = "", middle = "", last = "" } = value;
                            value = [first, middle, last].filter(Boolean).join(" ");
                        } else {
                            value = JSON.stringify(value);
                        }
                    }

                    if (typeof value === "string" && value.includes(",")) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }

                    return value;
                })
                .join(",")
        ),
    ];

    const csvString = csvRows.join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", finalFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
