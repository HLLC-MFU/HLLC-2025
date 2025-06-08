export interface TopContentStudentProps {
  filterValue: string;
  onSearchChange: (val: string) => void;
  onClear: () => void;
  majorFilter: Set<string>;
  setMajorFilter: (val: Set<string>) => void;
  schoolFilter: Set<string>;
  setSchoolFilter: (val: Set<string>) => void;
  majors: any[];
  schools: any[];
  usersLength: number;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}


export interface BottomContentProps {
    page: number;
    pages: number;
    setPage: (page: number) => void;
    selectedKeys: Set<string> | "all";
    items: any[];
    hasSearchFilter: boolean;
}

export const columns = [
  { name: "NAME", uid: "name", sortable: true },
  { name: "MAJOR", uid: "major", sortable: true },
];

export const INITIAL_VISIBLE_COLUMNS = ["name", "major"];