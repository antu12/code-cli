export interface PlanTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface PlanDocument {
  title: string;
  tasks: PlanTask[];
}
