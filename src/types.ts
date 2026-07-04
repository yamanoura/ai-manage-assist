export type View =
  | "today"
  | "tasks"
  | "habits"
  | "goals"
  | "feedback"
  | "journal"
  | "wellness"
  | "review";

export type Priority = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  due: string;
  priority: Priority;
  completed: boolean;
  goalId?: string;
}

export interface Habit {
  id: string;
  title: string;
  target: string;
  streak: number;
  completedDates: string[];
  color: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  progress: number;
  color: string;
}

export interface Feedback {
  id: string;
  content: string;
  cause: string;
  action: string;
  category: string;
  status: "open" | "improving" | "resolved";
  createdAt: string;
}

export interface WellnessEntry {
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleep: number;
  note: string;
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  title: string;
  thought: string;
  feeling: string;
  intensity: number;
  interpretation: string;
  insight: string;
  nextAction: string;
  tags: string[];
}

export interface AppData {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  feedback: Feedback[];
  journal: JournalEntry[];
  wellness: WellnessEntry[];
}
