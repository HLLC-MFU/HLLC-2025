export interface CategoryName {
  en: string;
  th: string;
}

export interface ReporterName {
  first: string;
  middle?: string; 
  last: string;
}

export interface Reporter {
  _id: string;
  username: string;
  name: ReporterName;
}

export interface ReportTypes {
  _id: string;
  name: CategoryName;
  color?: string;
}

export type ReportStatus = "pending" | "in-progress" | "done";

export interface Report {
  _id: string;
  reporter: Reporter | null;
  category: ReportTypes;
  message: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsByCategory {
  category: ReportTypes;
  reports: Report[];
}
