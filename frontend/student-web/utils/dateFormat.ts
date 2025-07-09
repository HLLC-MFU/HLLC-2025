export function formatDateTime(dateString?: string) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    const datePart = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
    });

    const timePart = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
    });

    return `${datePart}, ${timePart}`;
}
