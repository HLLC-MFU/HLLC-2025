import { School } from './school';

export type RawStepCounter = {
  user?: {
    name?: {
      first?: string;
      middle?: string;
      last?: string;
    };
    username?: string;
    metadata?: {
      major?: string;
    };
  };
  totalStep?: number;
  rank?: number;
  updatedAt?: string;
};

export type StepContersTableProps = {
  stepCounters: RawStepCounter[];
};

export type StepsCountersList = {
  key: string;
  rank: number | null;
  id: string;
  name: string;
  school: string;
  major: string;
  steps: number;
  time: string;
};
