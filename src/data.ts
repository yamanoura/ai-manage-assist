import type { AppData } from "./types";

const iso = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const today = iso();

export const initialData: AppData = {
  goals: [
    {
      id: "goal-health",
      title: "心身ともに余裕のある毎日をつくる",
      description: "睡眠と運動のリズムを整え、安定したコンディションを保つ",
      deadline: iso(76),
      progress: 64,
      color: "#477a65",
    },
    {
      id: "goal-skill",
      title: "仕事の専門性を一段上げる",
      description: "学習時間を確保し、小さなアウトプットを積み重ねる",
      deadline: iso(128),
      progress: 38,
      color: "#c16d4e",
    },
  ],
  tasks: [
    {
      id: "task-1",
      title: "企画書の構成を30分だけ考える",
      due: today,
      priority: "high",
      completed: false,
      goalId: "goal-skill",
    },
    {
      id: "task-2",
      title: "歯科検診を予約する",
      due: today,
      priority: "medium",
      completed: false,
      goalId: "goal-health",
    },
    {
      id: "task-3",
      title: "先週の学習メモを整理する",
      due: today,
      priority: "low",
      completed: true,
      goalId: "goal-skill",
    },
    {
      id: "task-4",
      title: "読みかけの本を20ページ読む",
      due: iso(1),
      priority: "low",
      completed: false,
      goalId: "goal-skill",
    },
  ],
  habits: [
    {
      id: "habit-1",
      title: "朝のストレッチ",
      target: "毎朝 10分",
      streak: 12,
      completedDates: [today],
      color: "#477a65",
    },
    {
      id: "habit-2",
      title: "学習する",
      target: "平日 30分",
      streak: 5,
      completedDates: [],
      color: "#c16d4e",
    },
    {
      id: "habit-3",
      title: "23:30までに就寝準備",
      target: "毎日",
      streak: 3,
      completedDates: [],
      color: "#6b7198",
    },
  ],
  feedback: [
    {
      id: "feedback-1",
      content: "説明に入る前に結論を伝える",
      cause: "背景から順番に話そうとして、要点が後ろに回りやすい",
      action: "最初の一文に結論を書く",
      category: "コミュニケーション",
      status: "improving",
      createdAt: iso(-9),
    },
    {
      id: "feedback-2",
      content: "予定を詰め込みすぎない",
      cause: "見積もりに余白を含めていない",
      action: "1日の予定は稼働時間の70%までにする",
      category: "セルフマネジメント",
      status: "open",
      createdAt: iso(-3),
    },
  ],
  journal: [],
  wellness: [
    { date: iso(-6), mood: 3, energy: 3, stress: 3, sleep: 6.2, note: "" },
    { date: iso(-5), mood: 4, energy: 3, stress: 2, sleep: 7.1, note: "" },
    { date: iso(-4), mood: 3, energy: 2, stress: 4, sleep: 5.8, note: "会議が多かった" },
    { date: iso(-3), mood: 4, energy: 4, stress: 2, sleep: 7.4, note: "" },
    { date: iso(-2), mood: 4, energy: 4, stress: 2, sleep: 7.0, note: "" },
    { date: iso(-1), mood: 5, energy: 4, stress: 1, sleep: 7.6, note: "散歩が気持ちよかった" },
  ],
};

export function normalizeAppData(data: Partial<AppData>): AppData {
  return {
    ...initialData,
    ...data,
    tasks: Array.isArray(data.tasks) ? data.tasks : initialData.tasks,
    habits: Array.isArray(data.habits) ? data.habits : initialData.habits,
    goals: Array.isArray(data.goals) ? data.goals : initialData.goals,
    feedback: Array.isArray(data.feedback) ? data.feedback : initialData.feedback,
    journal: Array.isArray(data.journal) ? data.journal : [],
    wellness: Array.isArray(data.wellness) ? data.wellness : initialData.wellness,
  };
}
