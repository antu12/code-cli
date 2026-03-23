export interface ProgressSnapshot {
  stepLabel: string;
  status: 'pending' | 'active' | 'done';
}
