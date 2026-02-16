export interface ClassSummary {
  id: string;
  name: string;
  code: string;
  description: string | null;
  studentCount: number;
  color: string | null;
  createdAt: Date;
}

export interface ClassListResult {
  classes: ClassSummary[];
  total: number;
  page: number;
  limit: number;
}
