export function exportToCsv(data: any[], filename = "export.csv") {
    if (!data || !data.length) {
        alert("No data to export");
        return;
    }
    const headers = Object.keys(data[0]);

    const csvRows = [
        headers.join(","),
        ...data.map(row =>
            headers
                .map(fieldName => {
                    let value = row[fieldName] ?? "";

                    // ถ้าเป็น object ให้แปลงเป็น string
                    if (typeof value === "object" && value !== null) {
                        // สมมติว่ารูปแบบ name เป็น {first, middle, last}
                        if (fieldName === "name") {
                            const { first = "", middle = "", last = "" } = value;
                            value = [first, middle, last].filter(Boolean).join(" ");
                        } else {
                            // ถ้า object รูปแบบอื่น ให้แปลงเป็น JSON string
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
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
