// Table configuration constants
export const COLUMNS = [
    { name: "CODE", uid: "code", sortable: true },
    { name: "EVOUCHER", uid: "evoucher", sortable: true },
    { name: "STATUS", uid: "status", sortable: true },
    { name: "USED BY", uid: "usedBy" },
    { name: "USED AT", uid: "usedAt", sortable: true },
    { name: "CREATED AT", uid: "createdAt", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

export const INITIAL_VISIBLE_COLUMNS = new Set([
    "code", "evoucher", "status", "usedBy", "usedAt", "createdAt", "actions"
]);

export const ROWS_PER_PAGE = 5;

// Utility functions
export const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; 