// Table configuration constants
export const COLUMNS = [
    { name: "SPONSOR", uid: "sponsors", sortable: true },
    { name: "ACRONYM", uid: "acronym", sortable: true },
    { name: "DETAIL", uid: "detail" },
    { name: "DISCOUNT", uid: "discount", sortable: true },
    { name: "EXPIRATION", uid: "expiration", sortable: true },
    { name: "STATUS", uid: "status", sortable: true },
    { name: "CLAIMS", uid: "claims" },
    { name: "COVER", uid: "cover" },
    { name: "ACTIONS", uid: "actions" },
];

export const INITIAL_VISIBLE_COLUMNS = new Set([
    "sponsors", "acronym", "detail", "discount", "expiration", "status", "claims", "cover", "actions"
]);

export const ROWS_PER_PAGE = 5;

// Utility functions
export const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ""; 