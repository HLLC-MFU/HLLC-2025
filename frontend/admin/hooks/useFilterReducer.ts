import { useReducer, useCallback } from 'react';

// Types
export type FilterState = {
    userType: string;
    school: string;
    major: string;
    searchQuery: string;
    page: number;
};

type FilterAction = 
    | { type: 'SET_FILTER'; field: keyof FilterState; value: string }
    | { type: 'SET_PAGE'; value: number }
    | { type: 'RESET_FILTERS' };

// Initial state
const initialFilterState: FilterState = {
    userType: "All",
    school: "All",
    major: "All",
    searchQuery: "",
    page: 1
};

// Reducer function
function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case 'SET_FILTER':
            return {
                ...state,
                [action.field]: action.value,
                ...(action.field !== 'page' && { page: 1 })
            };
        case 'SET_PAGE':
            return { ...state, page: action.value };
        case 'RESET_FILTERS':
            return { ...initialFilterState, page: 1 };
        default:
            return state;
    }
}

export function useFilterReducer() {
    const [state, dispatch] = useReducer(filterReducer, initialFilterState);

    const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
        dispatch({ type: 'SET_FILTER', field, value });
    }, []);

    const handlePageChange = useCallback((page: number) => {
        dispatch({ type: 'SET_PAGE', value: page });
    }, []);

    const handleResetFilters = useCallback(() => {
        dispatch({ type: 'RESET_FILTERS' });
    }, []);

    return {
        filterState: state,
        handleFilterChange,
        handlePageChange,
        handleResetFilters
    };
} 