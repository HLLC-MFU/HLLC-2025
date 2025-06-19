// Table configuration constants
export const COLUMNS = [
    { name: "CODE", uid: "code", sortable: true },
    { name: "EVOUCHER", uid: "evoucher", sortable: true },
    { name: "SPONSOR", uid: "sponsor", sortable: true },
    { name: "USED", uid: "isUsed", sortable: true },
    { name: "EXPIRATION", uid: "expiration", sortable: true },
    { name: "USER", uid: "user", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

export const INITIAL_VISIBLE_COLUMNS = new Set([
    "code", "evoucher", "sponsor", "isUsed", "expiration", "user", "actions"
]);
export const ROWS_PER_PAGE = 5;
export const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; 