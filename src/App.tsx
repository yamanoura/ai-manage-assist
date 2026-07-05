import { useEffect, useRef, useState } from "react";
import { signOut, type User } from "firebase/auth";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Cloud,
  CloudOff,
  Flame,
  HeartPulse,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Pencil,
  Plus,
  Quote,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { AuthScreen, FirebaseSetupScreen } from "./AuthScreen";
import { today } from "./data";
import { auth, isFirebaseConfigured } from "./firebase";
import { useAuth } from "./useAuth";
import { useCloudData, type SyncStatus } from "./useCloudData";
import type {
  AppData,
  Feedback,
  Goal,
  Habit,
  JournalEntry,
  Priority,
  Task,
  View,
  WellnessEntry,
} from "./types";

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "today", label: "今日", icon: LayoutDashboard },
  { id: "tasks", label: "タスク", icon: ListTodo },
  { id: "habits", label: "習慣", icon: CheckCircle2 },
  { id: "goals", label: "目標", icon: Target },
  { id: "feedback", label: "指摘台帳", icon: BookOpenCheck },
  { id: "journal", label: "思考ノート", icon: NotebookPen },
  { id: "wellness", label: "心身の記録", icon: HeartPulse },
  { id: "review", label: "振り返り", icon: Sparkles },
];

const uid = () => crypto.randomUUID();
type EditorType = "task" | "habit" | "goal" | "feedback";
type EditorItem = Task | Habit | Goal | Feedback;
type EditorState = { type: EditorType; item?: EditorItem };

const upsertById = <T extends { id: string }>(items: T[], item: T) =>
  items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [...items, item];

const dateText = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
const longDate = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "long",
}).format(new Date());

export default function App() {
  const { user, loading } = useAuth();

  if (!isFirebaseConfigured) return <FirebaseSetupScreen />;
  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;
  return <Workspace user={user} />;
}

function Workspace({ user }: { user: User }) {
  const { data, setData, status, error } = useCloudData(user);
  const [view, setView] = useState<View>("today");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const todayTasks = data.tasks.filter((task) => task.due === today);
  const doneCount = todayTasks.filter((task) => task.completed).length;
  const todayWellness = data.wellness.find((entry) => entry.date === today);

  const toggleTask = (id: string) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    }));
  };

  const deleteTask = (id: string) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
    }));
  };

  const toggleHabit = (id: string) => {
    setData((current) => ({
      ...current,
      habits: current.habits.map((habit) => {
        if (habit.id !== id) return habit;
        const completed = habit.completedDates.includes(today);
        return {
          ...habit,
          streak: Math.max(0, habit.streak + (completed ? -1 : 1)),
          completedDates: completed
            ? habit.completedDates.filter((date) => date !== today)
            : [...habit.completedDates, today],
        };
      }),
    }));
  };

  const saveWellness = (entry: WellnessEntry) => {
    setData((current) => ({
      ...current,
      wellness: [
        ...current.wellness.filter((item) => item.date !== entry.date),
        entry,
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  };

  const selectView = (next: View) => {
    setView(next);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        open={menuOpen}
        onSelect={selectView}
        onClose={() => setMenuOpen(false)}
      />

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)}>
            <Menu size={21} />
          </button>
          <div>
            <p className="eyebrow">{longDate}</p>
            <h1>{navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="account-area">
            <SyncBadge status={status} error={error} />
            <button className="avatar" aria-label="プロフィール" onClick={() => setProfileOpen(!profileOpen)}>
              {(user.displayName || user.email || "Y").slice(0, 1).toUpperCase()}
            </button>
            {profileOpen && (
              <div className="profile-menu">
                <strong>{user.displayName || "Yoridokoroユーザー"}</strong>
                <span>{user.email}</span>
                <button onClick={() => auth && signOut(auth)}><LogOut size={15} />ログアウト</button>
              </div>
            )}
          </div>
        </header>

        {view === "today" && (
          <TodayView
            tasks={todayTasks}
            habits={data.habits}
            goals={data.goals}
            doneCount={doneCount}
            wellness={todayWellness}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onEditTask={(task) => setEditor({ type: "task", item: task })}
            onToggleHabit={toggleHabit}
            onWellness={saveWellness}
            onNavigate={selectView}
            onAddTask={() => setEditor({ type: "task" })}
          />
        )}
        {view === "tasks" && (
          <TasksView
            tasks={data.tasks}
            goals={data.goals}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={(task) => setEditor({ type: "task", item: task })}
            onAdd={() => setEditor({ type: "task" })}
          />
        )}
        {view === "habits" && (
          <HabitsView
            habits={data.habits}
            onToggle={toggleHabit}
            onAdd={() => setEditor({ type: "habit" })}
            onEdit={(habit) => setEditor({ type: "habit", item: habit })}
            onDelete={(id) =>
              setData((current) => ({
                ...current,
                habits: current.habits.filter((habit) => habit.id !== id),
              }))
            }
          />
        )}
        {view === "goals" && (
          <GoalsView
            goals={data.goals}
            tasks={data.tasks}
            onAdd={() => setEditor({ type: "goal" })}
            onEdit={(goal) => setEditor({ type: "goal", item: goal })}
            onDelete={(id) =>
              setData((current) => ({
                ...current,
                goals: current.goals.filter((goal) => goal.id !== id),
                tasks: current.tasks.map((task) =>
                  task.goalId === id ? { ...task, goalId: undefined } : task,
                ),
              }))
            }
            onProgress={(id, progress) =>
              setData((current) => ({
                ...current,
                goals: current.goals.map((goal) =>
                  goal.id === id ? { ...goal, progress } : goal,
                ),
              }))
            }
          />
        )}
        {view === "feedback" && (
          <FeedbackView
            feedback={data.feedback}
            onAdd={() => setEditor({ type: "feedback" })}
            onEdit={(item) => setEditor({ type: "feedback", item })}
            onDelete={(id) =>
              setData((current) => ({
                ...current,
                feedback: current.feedback.filter((item) => item.id !== id),
              }))
            }
            onStatus={(id, status) =>
              setData((current) => ({
                ...current,
                feedback: current.feedback.map((item) =>
                  item.id === id ? { ...item, status } : item,
                ),
              }))
            }
          />
        )}
        {view === "journal" && (
          <JournalView
            entries={data.journal}
            onSave={(entry) =>
              setData((current) => ({
                ...current,
                journal: [entry, ...current.journal],
              }))
            }
            onUpdate={(entry) =>
              setData((current) => ({
                ...current,
                journal: current.journal.map((item) =>
                  item.id === entry.id ? entry : item,
                ),
              }))
            }
            onDelete={(id) =>
              setData((current) => ({
                ...current,
                journal: current.journal.filter((entry) => entry.id !== id),
              }))
            }
            onCreateTask={(title) =>
              setData((current) => ({
                ...current,
                tasks: [
                  ...current.tasks,
                  {
                    id: uid(),
                    title,
                    due: today,
                    priority: "medium",
                    completed: false,
                  },
                ],
              }))
            }
          />
        )}
        {view === "wellness" && (
          <WellnessView entries={data.wellness} onSave={saveWellness} />
        )}
        {view === "review" && <ReviewView data={data} />}
      </main>

      <MobileNav view={view} onSelect={selectView} />

      {editor && (
        <CreateModal
          type={editor.type}
          item={editor.item}
          goals={data.goals}
          onClose={() => setEditor(null)}
          onSave={(item) => {
            setData((current) => {
              if (editor.type === "task")
                return { ...current, tasks: upsertById(current.tasks, item as Task) };
              if (editor.type === "habit")
                return { ...current, habits: upsertById(current.habits, item as Habit) };
              if (editor.type === "goal")
                return { ...current, goals: upsertById(current.goals, item as Goal) };
              return { ...current, feedback: upsertById(current.feedback, item as Feedback) };
            });
            setEditor(null);
          }}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-page">
      <div className="loading-mark"><Quote size={22} fill="currentColor" /></div>
      <span>記録を準備しています…</span>
    </main>
  );
}

function SyncBadge({ status, error }: { status: SyncStatus; error: string }) {
  const text = {
    loading: "読込中",
    saving: "保存中",
    synced: "同期済み",
    error: "同期エラー",
  }[status];
  return (
    <span className={`sync-badge ${status}`} title={error || "Firestoreと同期しています"}>
      {status === "error" ? <CloudOff size={14} /> : <Cloud size={14} />}
      {text}
    </span>
  );
}

function Sidebar({
  view,
  open,
  onSelect,
  onClose,
}: {
  view: View;
  open: boolean;
  onSelect: (view: View) => void;
  onClose: () => void;
}) {
  return (
    <>
      {open && <button className="sidebar-backdrop" onClick={onClose} aria-label="閉じる" />}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Quote size={18} fill="currentColor" /></div>
          <div>
            <strong>Yoridokoro</strong>
            <span>整えて、前へ。</span>
          </div>
          <button className="icon-button sidebar-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? "active" : ""}
                onClick={() => onSelect(item.id)}
              >
                <Icon size={19} strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <Moon size={17} />
          <div>
            <strong>小さく続ける</strong>
            <span>完璧より、今日の一歩。</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function MobileNav({ view, onSelect }: { view: View; onSelect: (view: View) => void }) {
  const items = navItems.filter((item) =>
    ["today", "tasks", "journal", "goals", "wellness"].includes(item.id),
  );
  return (
    <nav className="mobile-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={view === item.id ? "active" : ""}
            onClick={() => onSelect(item.id)}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TodayView({
  tasks,
  habits,
  goals,
  doneCount,
  wellness,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onToggleHabit,
  onWellness,
  onNavigate,
  onAddTask,
}: {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  doneCount: number;
  wellness?: WellnessEntry;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onToggleHabit: (id: string) => void;
  onWellness: (entry: WellnessEntry) => void;
  onNavigate: (view: View) => void;
  onAddTask: () => void;
}) {
  const remaining = tasks.length - doneCount;
  return (
    <div className="page page-enter">
      <section className="welcome">
        <div>
          <p>おはようございます。</p>
          <h2>今日も、自分のペースで。</h2>
        </div>
        <div className="day-progress">
          <strong>{tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0}%</strong>
          <span>今日の進み具合</span>
        </div>
      </section>

      <section className="insight-banner">
        <div className="insight-icon"><Sparkles size={21} /></div>
        <div>
          <span className="label">今日のヒント</span>
          <p>
            {remaining > 2
              ? `タスクが${remaining}件あります。まず「一番小さく始められるもの」を選びましょう。`
              : remaining > 0
                ? `残りは${remaining}件です。焦らず、ひとつずつ終わらせましょう。`
                : "今日のタスクは完了です。余白を次の回復に使いましょう。"}
          </p>
        </div>
        <button onClick={() => onNavigate("review")}>
          詳しく見る <ArrowRight size={16} />
        </button>
      </section>

      <div className="dashboard-grid">
        <section className="card tasks-card">
          <SectionHead
            title="今日のタスク"
            meta={`${doneCount} / ${tasks.length} 完了`}
            action="追加"
            onAction={onAddTask}
          />
          <div className="task-list">
            {tasks.length === 0 && <Empty text="今日のタスクはありません" />}
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                goals={goals}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
              />
            ))}
          </div>
          <button className="text-link" onClick={() => onNavigate("tasks")}>
            すべてのタスクを見る <ChevronRight size={16} />
          </button>
        </section>

        <section className="card habits-card">
          <SectionHead title="今日の習慣" meta={`${habits.filter((h) => h.completedDates.includes(today)).length} / ${habits.length}`} />
          <div className="habit-list">
            {habits.map((habit) => (
              <HabitRow key={habit.id} habit={habit} onToggle={onToggleHabit} />
            ))}
          </div>
          <button className="text-link" onClick={() => onNavigate("habits")}>
            習慣の記録を見る <ChevronRight size={16} />
          </button>
        </section>

        <WellnessCheckin entry={wellness} onSave={onWellness} />

        <section className="card goals-card">
          <SectionHead title="目標への歩み" action="すべて見る" onAction={() => onNavigate("goals")} />
          <div className="goal-mini-list">
            {goals.slice(0, 2).map((goal) => (
              <div className="goal-mini" key={goal.id}>
                <div className="goal-mini-top">
                  <span className="goal-dot" style={{ background: goal.color }} />
                  <strong>{goal.title}</strong>
                  <span>{goal.progress}%</span>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${goal.progress}%`, background: goal.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHead({
  title,
  meta,
  action,
  onAction,
}: {
  title: string;
  meta?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-head">
      <div>
        <h3>{title}</h3>
        {meta && <span>{meta}</span>}
      </div>
      {action && (
        <button onClick={onAction}>
          {action === "追加" && <Plus size={15} />} {action}
        </button>
      )}
    </div>
  );
}

function TaskRow({
  task,
  goals,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task;
  goals: Goal[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const goal = goals.find((item) => item.id === task.goalId);
  const confirmDelete = () => {
    if (window.confirm(`「${task.title}」を削除しますか？`)) {
      onDelete(task.id);
    }
  };

  return (
    <div className={`task-row ${task.completed ? "completed" : ""}`}>
      <button
        className="task-toggle"
        onClick={() => onToggle(task.id)}
        aria-label={`${task.title}を${task.completed ? "未完了" : "完了"}にする`}
      >
        <span className="check-circle">
          {task.completed ? <Check size={15} /> : <Circle size={18} />}
        </span>
        <span className="task-copy">
          <strong>{task.title}</strong>
          <small>
            <span className={`priority ${task.priority}`} />
            {goal?.title ?? "個人タスク"}
          </small>
        </span>
      </button>
      <span className="task-date">{task.due === today ? "今日" : dateText(task.due)}</span>
      <button
        className="item-edit"
        onClick={() => onEdit(task)}
        aria-label={`${task.title}を修正`}
        title="タスクを修正"
      >
        <Pencil size={15} />
      </button>
      <button
        className="task-delete"
        onClick={confirmDelete}
        aria-label={`${task.title}を削除`}
        title="タスクを削除"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function HabitRow({ habit, onToggle }: { habit: Habit; onToggle: (id: string) => void }) {
  const completed = habit.completedDates.includes(today);
  return (
    <button className={`habit-row ${completed ? "completed" : ""}`} onClick={() => onToggle(habit.id)}>
      <span className="habit-icon" style={{ color: habit.color, background: `${habit.color}17` }}>
        {completed ? <Check size={18} /> : <Activity size={18} />}
      </span>
      <span>
        <strong>{habit.title}</strong>
        <small>{habit.target}</small>
      </span>
      <span className="streak"><Flame size={14} /> {habit.streak}日</span>
    </button>
  );
}

function WellnessCheckin({
  entry,
  onSave,
}: {
  entry?: WellnessEntry;
  onSave: (entry: WellnessEntry) => void;
}) {
  const [mood, setMood] = useState(entry?.mood ?? 0);
  const moods = [
    { value: 1, emoji: "😣", label: "つらい" },
    { value: 2, emoji: "😕", label: "低め" },
    { value: 3, emoji: "😐", label: "ふつう" },
    { value: 4, emoji: "🙂", label: "よい" },
    { value: 5, emoji: "😊", label: "とてもよい" },
  ];

  const save = (value: number) => {
    setMood(value);
    onSave({
      date: today,
      mood: value,
      energy: entry?.energy ?? 3,
      stress: entry?.stress ?? 3,
      sleep: entry?.sleep ?? 7,
      note: entry?.note ?? "",
    });
  };

  return (
    <section className="card checkin-card">
      <SectionHead title="いまの調子は？" meta={mood ? "記録済み" : "10秒チェックイン"} />
      <div className="mood-picker">
        {moods.map((item) => (
          <button
            key={item.value}
            className={mood === item.value ? "selected" : ""}
            onClick={() => save(item.value)}
            aria-label={item.label}
          >
            <span>{item.emoji}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </div>
      <p className="privacy-note">記録はこのブラウザ内だけに保存されます。</p>
    </section>
  );
}

function TasksView({
  tasks,
  goals,
  onToggle,
  onDelete,
  onEdit,
  onAdd,
}: {
  tasks: Task[];
  goals: Goal[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onAdd: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const filtered = tasks.filter((task) =>
    filter === "all" ? true : filter === "done" ? task.completed : !task.completed,
  );
  return (
    <div className="page page-enter">
      <PageIntro
        title="やることを、無理のない大きさに。"
        text="目標につながる一歩を整理します。"
        button="タスクを追加"
        onClick={onAdd}
      />
      <div className="filter-tabs">
        {(["all", "open", "done"] as const).map((item) => (
          <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
            {item === "all" ? "すべて" : item === "open" ? "未完了" : "完了"}
          </button>
        ))}
      </div>
      <section className="card full-card">
        <div className="task-list large">
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              goals={goals}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
          {!filtered.length && <Empty text="該当するタスクはありません" />}
        </div>
      </section>
    </div>
  );
}

function HabitsView({
  habits,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
}: {
  habits: Habit[];
  onToggle: (id: string) => void;
  onAdd: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="page page-enter">
      <PageIntro
        title="繰り返す行動が、未来をつくる。"
        text="できた日も、できなかった日も、そのまま記録します。"
        button="習慣を追加"
        onClick={onAdd}
      />
      <div className="cards-grid">
        {!habits.length && <Empty text="習慣はまだありません" />}
        {habits.map((habit) => {
          const completed = habit.completedDates.includes(today);
          return (
            <section className="card habit-detail" key={habit.id}>
              <div className="card-edit-actions">
                <button
                  className="item-edit"
                  onClick={() => onEdit(habit)}
                  aria-label={`${habit.title}を修正`}
                  title="習慣を修正"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="item-delete"
                  onClick={() => {
                    if (window.confirm(`「${habit.title}」を削除しますか？`)) onDelete(habit.id);
                  }}
                  aria-label={`${habit.title}を削除`}
                  title="習慣を削除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <span className="habit-icon large" style={{ color: habit.color, background: `${habit.color}17` }}>
                <Activity size={22} />
              </span>
              <h3>{habit.title}</h3>
              <p className="habit-target">{habit.target}</p>
              {habit.description && (
                <p className="habit-description">{habit.description}</p>
              )}
              <div className="streak-big"><Flame size={20} /> {habit.streak}<small>日継続</small></div>
              <button className={`complete-button ${completed ? "done" : ""}`} onClick={() => onToggle(habit.id)}>
                {completed ? <><Check size={18} /> 今日もできた</> : "今日の記録をつける"}
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function GoalsView({
  goals,
  tasks,
  onAdd,
  onEdit,
  onDelete,
  onProgress,
}: {
  goals: Goal[];
  tasks: Task[];
  onAdd: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onProgress: (id: string, progress: number) => void;
}) {
  return (
    <div className="page page-enter">
      <PageIntro
        title="行き先が見えれば、一歩が選べる。"
        text="大切にしたいことと、日々の行動をつなぎます。"
        button="目標を追加"
        onClick={onAdd}
      />
      <div className="goal-cards">
        {!goals.length && <Empty text="目標はまだありません" />}
        {goals.map((goal) => {
          const linked = tasks.filter((task) => task.goalId === goal.id);
          const done = linked.filter((task) => task.completed).length;
          return (
            <section className="card goal-card" key={goal.id}>
              <div className="goal-accent" style={{ background: goal.color }} />
              <div className="goal-card-top">
                <div>
                  <span className="label">期限 {dateText(goal.deadline)}</span>
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                </div>
                <div className="goal-card-actions">
                  <strong style={{ color: goal.color }}>{goal.progress}%</strong>
                  <button
                    className="item-edit"
                    onClick={() => onEdit(goal)}
                    aria-label={`${goal.title}を修正`}
                    title="目標を修正"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="goal-delete"
                    onClick={() => {
                      const taskNote = linked.length
                        ? `\n関連する${linked.length}件のタスクは「関連目標なし」で残ります。`
                        : "";
                      if (window.confirm(`「${goal.title}」を削除しますか？${taskNote}`)) {
                        onDelete(goal.id);
                      }
                    }}
                    aria-label={`${goal.title}を削除`}
                    title="目標を削除"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <input
                className="progress-slider"
                type="range"
                min="0"
                max="100"
                value={goal.progress}
                style={{ accentColor: goal.color }}
                onChange={(event) => onProgress(goal.id, Number(event.target.value))}
              />
              <div className="goal-meta">
                <span><ClipboardCheck size={15} /> 関連タスク {done}/{linked.length}</span>
                <span><CalendarDays size={15} /> {dateText(goal.deadline)}まで</span>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackView({
  feedback,
  onAdd,
  onEdit,
  onDelete,
  onStatus,
}: {
  feedback: Feedback[];
  onAdd: () => void;
  onEdit: (item: Feedback) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, status: Feedback["status"]) => void;
}) {
  const statusText = { open: "未着手", improving: "改善中", resolved: "定着" };
  const nextStatus: Record<Feedback["status"], Feedback["status"]> = {
    open: "improving",
    improving: "resolved",
    resolved: "open",
  };
  return (
    <div className="page page-enter">
      <PageIntro
        title="気づきを、次の行動へ。"
        text="反省ではなく、同じ場面でよりよく動くための記録です。"
        button="気づきを追加"
        onClick={onAdd}
      />
      <div className="feedback-list">
        {!feedback.length && <Empty text="指摘・気づきはまだありません" />}
        {feedback.map((item) => (
          <section className="card feedback-card" key={item.id}>
            <div className="feedback-top">
              <span className="category">{item.category}</span>
              <div className="feedback-actions">
                <button
                  className={`status ${item.status}`}
                  onClick={() => onStatus(item.id, nextStatus[item.status])}
                >
                  {statusText[item.status]}
                </button>
                <button
                  className="item-edit"
                  onClick={() => onEdit(item)}
                  aria-label={`${item.content}を修正`}
                  title="指摘を修正"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="feedback-delete"
                  onClick={() => {
                    if (window.confirm(`「${item.content}」を削除しますか？`)) {
                      onDelete(item.id);
                    }
                  }}
                  aria-label={`${item.content}を削除`}
                  title="指摘データを削除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <h3>{item.content}</h3>
            <div className="feedback-detail">
              <div><span>背景・原因</span><p>{item.cause}</p></div>
              <div><span>次に試すこと</span><p>{item.action}</p></div>
            </div>
            <small>記録日 {dateText(item.createdAt)}</small>
          </section>
        ))}
      </div>
    </div>
  );
}

const feelings = ["うれしい", "穏やか", "わくわく", "不安", "焦り", "怒り", "悲しい", "もやもや"];

function JournalView({
  entries,
  onSave,
  onUpdate,
  onDelete,
  onCreateTask,
}: {
  entries: JournalEntry[];
  onSave: (entry: JournalEntry) => void;
  onUpdate: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  onCreateTask: (title: string) => void;
}) {
  const [composing, setComposing] = useState(entries.length === 0);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [taskCreated, setTaskCreated] = useState("");
  const sortedEntries = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const editorOpen = composing || Boolean(editingEntry);

  return (
    <div className="page page-enter">
      <PageIntro
        title="頭の中を、扱える言葉に。"
        text="考えと気持ちをほどき、アイデアと次の一歩につなげます。"
        button={editorOpen ? "入力を閉じる" : "書き出す"}
        onClick={() => {
          if (editorOpen) {
            setComposing(false);
            setEditingEntry(null);
          } else {
            setComposing(true);
          }
        }}
      />

      {editorOpen && (
        <JournalComposer
          key={editingEntry?.id ?? "new-entry"}
          initialEntry={editingEntry ?? undefined}
          onCancel={() => {
            setComposing(false);
            setEditingEntry(null);
          }}
          onSave={(entry) => {
            if (editingEntry) onUpdate(entry);
            else onSave(entry);
            setComposing(false);
            setEditingEntry(null);
          }}
        />
      )}

      <section className="thinking-guide">
        <div className="thinking-guide-icon"><Lightbulb size={20} /></div>
        <div>
          <span className="label">THINKING PRACTICE</span>
          <h3>事実・解釈・感情・行動を分ける</h3>
          <p>「起きたこと」と「自分が意味づけたこと」を分けるだけで、選べる行動が増えていきます。</p>
        </div>
      </section>

      {taskCreated && (
        <div className="journal-toast">
          <Check size={15} />「{taskCreated}」を今日のタスクに追加しました
        </div>
      )}

      <div className="journal-list">
        {!sortedEntries.length && <Empty text="まだ記録がありません。いま頭にあることから書いてみましょう。" />}
        {sortedEntries.map((entry) => (
          <article className="card journal-card" key={entry.id}>
            <div className="journal-card-head">
              <div>
                <span className="journal-date">
                  {new Intl.DateTimeFormat("ja-JP", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(entry.createdAt))}
                </span>
                <h3>{entry.title}</h3>
              </div>
              <div className="journal-card-actions">
                <span className="feeling-badge">{entry.feeling || "未分類"} · {entry.intensity}/5</span>
                <button
                  className="journal-edit"
                  onClick={() => {
                    setComposing(false);
                    setEditingEntry(entry);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-label={`${entry.title}を編集`}
                  title="思考ノートを編集"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="journal-delete"
                  onClick={() => {
                    if (window.confirm(`「${entry.title}」を削除しますか？`)) onDelete(entry.id);
                  }}
                  aria-label={`${entry.title}を削除`}
                  title="思考ノートを削除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <p className="journal-thought">{entry.thought}</p>
            {entry.interpretation && (
              <div className="journal-block">
                <span>自分の解釈・前提</span>
                <p>{entry.interpretation}</p>
              </div>
            )}
            {entry.insight && (
              <div className="journal-block insight">
                <Lightbulb size={16} />
                <div><span>気づき・アイデア</span><p>{entry.insight}</p></div>
              </div>
            )}
            {entry.nextAction && (
              <div className="journal-action">
                <div><span>次に試すこと</span><strong>{entry.nextAction}</strong></div>
                <button
                  onClick={() => {
                    onCreateTask(entry.nextAction);
                    setTaskCreated(entry.nextAction);
                    window.setTimeout(() => setTaskCreated(""), 3000);
                  }}
                >
                  <Plus size={14} /> タスクにする
                </button>
              </div>
            )}
            {!!entry.tags.length && (
              <div className="journal-tags">
                {entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function JournalComposer({
  initialEntry,
  onSave,
  onCancel,
}: {
  initialEntry?: JournalEntry;
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialEntry?.title ?? "");
  const [thought, setThought] = useState(initialEntry?.thought ?? "");
  const [feeling, setFeeling] = useState(initialEntry?.feeling ?? "");
  const [intensity, setIntensity] = useState(initialEntry?.intensity ?? 3);
  const [interpretation, setInterpretation] = useState(initialEntry?.interpretation ?? "");
  const [insight, setInsight] = useState(initialEntry?.insight ?? "");
  const [nextAction, setNextAction] = useState(initialEntry?.nextAction ?? "");
  const [tagText, setTagText] = useState(initialEntry?.tags.join(", ") ?? "");

  const thinkingPrompt =
    feeling === "不安" || feeling === "焦り"
      ? "確かな事実と、まだ想像にすぎないことを分けると？"
      : feeling === "怒り"
        ? "その反応の奥で、本当は何を大切にしたかった？"
        : feeling === "悲しい"
          ? "親しい人が同じ状況なら、どんな言葉をかける？"
          : "反対の立場から見ると、どんな解釈ができる？";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!thought.trim()) return;
    const fallbackTitle = thought.trim().split("\n")[0].slice(0, 32);
    onSave({
      id: initialEntry?.id ?? uid(),
      createdAt: initialEntry?.createdAt ?? new Date().toISOString(),
      title: title.trim() || fallbackTitle,
      thought: thought.trim(),
      feeling,
      intensity,
      interpretation: interpretation.trim(),
      insight: insight.trim(),
      nextAction: nextAction.trim(),
      tags: tagText
        .split(/[,、\s]+/)
        .map((tag) => tag.replace(/^#/, "").trim())
        .filter(Boolean)
        .slice(0, 8),
    });
  };

  return (
    <form className="card journal-composer" onSubmit={submit}>
      <div className="composer-head">
        <div>
          <span className="label">{initialEntry ? "EDIT NOTE" : "NEW NOTE"}</span>
          <h3>{initialEntry ? "記録した内容を見直す" : "いまの自分を、そのまま書き出す"}</h3>
        </div>
        <button type="button" className="icon-button" onClick={onCancel}><X size={19} /></button>
      </div>

      <label className="field">
        <span>タイトル <small>空欄でも構いません</small></span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="あとで見つけやすい短い名前" />
      </label>
      <label className="field">
        <span>いま考えていること・頭から離れないこと</span>
        <textarea
          className="thought-input"
          autoFocus
          required
          value={thought}
          onChange={(event) => setThought(event.target.value)}
          placeholder="まとまっていなくて大丈夫です。浮かんだ順に書いてください。"
        />
      </label>

      <fieldset className="feeling-field">
        <legend>いちばん近い気持ち</legend>
        <div className="feeling-options">
          {feelings.map((item) => (
            <button
              type="button"
              key={item}
              className={feeling === item ? "selected" : ""}
              onClick={() => setFeeling(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field range-field">
        <span>気持ちの強さ <strong>{intensity}/5</strong></span>
        <input type="range" min="1" max="5" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} />
        <small><span>かすか</span><span>とても強い</span></small>
      </label>

      <div className="thinking-question"><Lightbulb size={16} /><span>{thinkingPrompt}</span></div>
      <label className="field">
        <span>自分はどう解釈している？ どんな前提がある？</span>
        <textarea value={interpretation} onChange={(event) => setInterpretation(event.target.value)} placeholder="事実と、自分の解釈を分けてみる" />
      </label>
      <label className="field">
        <span>そこから得た気づき・アイデア</span>
        <textarea value={insight} onChange={(event) => setInsight(event.target.value)} placeholder="別の見方、試せそうな工夫、覚えておきたいこと" />
      </label>
      <label className="field">
        <span>次に試す小さな行動</span>
        <input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="例：明日の会議で最初に結論を一文で伝える" />
      </label>
      <label className="field">
        <span>タグ</span>
        <input value={tagText} onChange={(event) => setTagText(event.target.value)} placeholder="仕事, 人間関係, 学び（空白・カンマ区切り）" />
      </label>

      <div className="composer-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="primary-button" disabled={!thought.trim()}>
          {initialEntry ? <Pencil size={16} /> : <NotebookPen size={16} />}
          {initialEntry ? "更新する" : "記録する"}
        </button>
      </div>
    </form>
  );
}

function WellnessView({
  entries,
  onSave,
}: {
  entries: WellnessEntry[];
  onSave: (entry: WellnessEntry) => void;
}) {
  const recordRef = useRef<HTMLElement>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const selected = entries.find((entry) => entry.date === selectedDate);
  const [form, setForm] = useState<WellnessEntry>(
    selected ?? { date: selectedDate, mood: 3, energy: 3, stress: 3, sleep: 7, note: "" },
  );
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 7).reverse();
  const selectedDateText = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${selectedDate}T00:00:00`));

  useEffect(() => {
    setForm(
      selected ?? {
        date: selectedDate,
        mood: 3,
        energy: 3,
        stress: 3,
        sleep: 7,
        note: "",
      },
    );
  }, [selected, selectedDate]);

  const showRecord = (date: string, scrollToRecord = false) => {
    setSelectedDate(date);
    if (scrollToRecord) {
      window.requestAnimationFrame(() => {
        recordRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return (
    <div className="page page-enter">
      <PageIntro title="調子を知ることから、整える。" text="診断ではなく、自分の波に気づくための記録です。" />
      <div className="wellness-grid">
        <section className="card record-card" ref={recordRef}>
          <div className="wellness-record-head">
            <div>
              <h3>{selectedDate === today ? "今日の記録" : selectedDateText}</h3>
              <span>{selected ? "記録済み・更新できます" : "未記録"}</span>
            </div>
            <label className="wellness-date-picker">
              <span>日付を選ぶ</span>
              <input
                type="date"
                max={today}
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
          </div>
          <div className={`selected-record-indicator ${selected ? "saved" : "new"}`} aria-live="polite">
            <CalendarDays size={18} />
            <div>
              <span>現在表示している記録</span>
              <strong>{selectedDateText}</strong>
            </div>
            <span className="selected-record-state">
              {selected ? "保存済みデータを表示中" : "この日の記録は未登録"}
            </span>
          </div>
          <RangeField label="気分" low="つらい" high="よい" value={form.mood} onChange={(mood) => setForm({ ...form, mood })} />
          <RangeField label="エネルギー" low="少ない" high="十分" value={form.energy} onChange={(energy) => setForm({ ...form, energy })} />
          <RangeField label="ストレス" low="低い" high="高い" value={form.stress} onChange={(stress) => setForm({ ...form, stress })} />
          <label className="field">
            <span>睡眠時間</span>
            <div className="sleep-input">
              <input type="number" min="0" max="15" step="0.5" value={form.sleep} onChange={(e) => setForm({ ...form, sleep: Number(e.target.value) })} />
              <span>時間</span>
            </div>
          </label>
          <label className="field">
            <span>ひとことメモ</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="今日あったこと、気づいたこと" />
          </label>
          <button className="primary-button full" onClick={() => onSave(form)}>
            {selected ? "この日の記録を更新" : "この日の状態を保存"}
          </button>
        </section>
        <section className="card chart-card">
          <SectionHead title="最近のコンディション" meta="直近7件" />
          <div className="bar-chart">
            {recent.map((entry) => (
              <button
                className={`bar-column ${entry.date === selectedDate ? "selected" : ""}`}
                key={entry.date}
                onClick={() => showRecord(entry.date)}
                aria-label={`${dateText(entry.date)}の記録を見る`}
              >
                <div className="bar-value" style={{ height: `${entry.mood * 16}%` }} />
                <small>{dateText(entry.date).replace("月", "/")}</small>
              </button>
            ))}
          </div>
          <div className="wellness-summary">
            <TrendingUp size={20} />
            <p>記録を続けると、睡眠やストレスと気分の関係が見えやすくなります。</p>
          </div>
        </section>
      </div>
      <section className="card wellness-history">
        <SectionHead title="これまでの記録" meta={`${sorted.length}件`} />
        {!sorted.length && <Empty text="心身の記録はまだありません" />}
        <div className="wellness-history-list">
          {sorted.map((entry) => (
            <button
              key={entry.date}
              className={entry.date === selectedDate ? "selected" : ""}
              onClick={() => showRecord(entry.date, true)}
              aria-current={entry.date === selectedDate ? "true" : undefined}
            >
              <span className="wellness-history-date">
                <CalendarDays size={16} />
                <strong>{new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${entry.date}T00:00:00`))}</strong>
              </span>
              <span>気分 <strong>{entry.mood}/5</strong></span>
              <span>活力 <strong>{entry.energy}/5</strong></span>
              <span>ストレス <strong>{entry.stress}/5</strong></span>
              <span>睡眠 <strong>{entry.sleep}時間</strong></span>
              <small>{entry.note || "メモなし"}</small>
              <span className="wellness-history-open-state">
                {entry.date === selectedDate ? <><Check size={15} /> 表示中</> : <ChevronRight size={17} />}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function RangeField({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field range-field">
      <span>{label}<strong>{value}</strong></span>
      <input type="range" min="1" max="5" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <small><span>{low}</span><span>{high}</span></small>
    </label>
  );
}

function ReviewView({ data }: { data: AppData }) {
  const completion = data.tasks.length
    ? Math.round((data.tasks.filter((task) => task.completed).length / data.tasks.length) * 100)
    : 0;
  const habitDone = data.habits.filter((habit) => habit.completedDates.includes(today)).length;
  const recent = data.wellness.slice(-7);
  const avgSleep = recent.length
    ? (recent.reduce((sum, item) => sum + item.sleep, 0) / recent.length).toFixed(1)
    : "—";
  const avgMood = recent.length
    ? recent.reduce((sum, item) => sum + item.mood, 0) / recent.length
    : 0;

  const insight =
    avgMood < 3
      ? "気分が低めの日が続いています。来週は予定を一つ減らし、回復の時間を先に確保してみましょう。"
      : Number(avgSleep) < 6.5
        ? "睡眠がやや短めです。成果を増やすより、就寝前の習慣を一つ整える週にするのがよさそうです。"
        : "コンディションは比較的安定しています。今のペースを保ちながら、優先目標に30分だけ集中する時間をつくりましょう。";

  return (
    <div className="page page-enter">
      <PageIntro title="一週間を、次の一歩につなげる。" text="記録から傾向を読み取り、無理のない改善案をまとめます。" />
      <section className="review-hero">
        <div className="ai-orb"><Brain size={30} /></div>
        <div>
          <span className="label">今週のAIレビュー</span>
          <h2>{insight}</h2>
          <p>これは医療上の診断ではなく、あなたの記録をもとにしたセルフケアの提案です。</p>
        </div>
      </section>
      <div className="review-stats">
        <StatCard label="タスク完了率" value={`${completion}%`} icon={ClipboardCheck} />
        <StatCard label="今日の習慣" value={`${habitDone}/${data.habits.length}`} icon={Flame} />
        <StatCard label="平均睡眠" value={`${avgSleep}h`} icon={Moon} />
        <StatCard label="改善中の気づき" value={`${data.feedback.filter((item) => item.status === "improving").length}件`} icon={TrendingUp} />
      </div>
      <section className="card next-action">
        <div className="insight-icon"><Sparkles size={21} /></div>
        <div>
          <span className="label">来週の小さな実験</span>
          <h3>一日の最重要タスクを、朝のうちに30分だけ進める</h3>
          <p>達成できる大きさに区切り、終わった時点で自分の調子も一緒に記録しましょう。</p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
}) {
  return (
    <section className="card stat-card">
      <Icon size={20} />
      <strong>{value}</strong>
      <span>{label}</span>
    </section>
  );
}

function PageIntro({
  title,
  text,
  button,
  onClick,
}: {
  title: string;
  text: string;
  button?: string;
  onClick?: () => void;
}) {
  return (
    <section className="page-intro">
      <div><h2>{title}</h2><p>{text}</p></div>
      {button && <button className="primary-button" onClick={onClick}><Plus size={17} /> {button}</button>}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="empty"><CheckCircle2 size={22} /><span>{text}</span></div>;
}

function CreateModal({
  type,
  item,
  goals,
  onClose,
  onSave,
}: {
  type: EditorType;
  item?: EditorItem;
  goals: Goal[];
  onClose: () => void;
  onSave: (item: Task | Habit | Goal | Feedback) => void;
}) {
  const task = type === "task" ? item as Task | undefined : undefined;
  const habit = type === "habit" ? item as Habit | undefined : undefined;
  const goal = type === "goal" ? item as Goal | undefined : undefined;
  const feedback = type === "feedback" ? item as Feedback | undefined : undefined;
  const [title, setTitle] = useState(task?.title ?? habit?.title ?? goal?.title ?? feedback?.content ?? "");
  const [detail, setDetail] = useState(task?.due ?? habit?.target ?? goal?.deadline ?? feedback?.cause ?? "");
  const [extra, setExtra] = useState(habit?.description ?? goal?.description ?? feedback?.action ?? "");
  const [goalId, setGoalId] = useState(task?.goalId ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const editing = Boolean(item);
  const labels = {
    task: { title: editing ? "タスクを修正" : "タスクを追加", field: "やること", placeholder: "例：企画書の構成を考える" },
    habit: { title: editing ? "習慣を修正" : "習慣を追加", field: "習慣名", placeholder: "例：朝のストレッチ" },
    goal: { title: editing ? "目標を修正" : "目標を追加", field: "目標", placeholder: "例：心身に余裕のある毎日をつくる" },
    feedback: { title: editing ? "気づきを修正" : "気づきを追加", field: "気づき・指摘", placeholder: "例：説明は結論から伝える" },
  }[type];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    if (type === "task") {
      onSave({ id: task?.id ?? uid(), title: title.trim(), due: detail || today, priority, completed: task?.completed ?? false, goalId: goalId || undefined });
    } else if (type === "habit") {
      onSave({ id: habit?.id ?? uid(), title: title.trim(), target: detail || "毎日", description: extra.trim(), streak: habit?.streak ?? 0, completedDates: habit?.completedDates ?? [], color: habit?.color ?? "#477a65" });
    } else if (type === "goal") {
      onSave({ id: goal?.id ?? uid(), title: title.trim(), description: extra, deadline: detail || today, progress: goal?.progress ?? 0, color: goal?.color ?? "#c16d4e" });
    } else {
      onSave({ id: feedback?.id ?? uid(), content: title.trim(), cause: detail || "まだ整理できていない", action: extra || "次回、意識して観察する", category: feedback?.category ?? "自分の気づき", status: feedback?.status ?? "open", createdAt: feedback?.createdAt ?? today });
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head"><h2>{labels.title}</h2><button type="button" className="icon-button" onClick={onClose}><X size={20} /></button></div>
        <label className="field"><span>{labels.field}</span><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder={labels.placeholder} /></label>
        {type === "task" && (
          <>
            <label className="field"><span>期限</span><input type="date" value={detail || today} onChange={(e) => setDetail(e.target.value)} /></label>
            <label className="field"><span>優先度</span><select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></label>
            <label className="field"><span>関連する目標</span><select value={goalId} onChange={(e) => setGoalId(e.target.value)}><option value="">なし</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
          </>
        )}
        {type === "habit" && (
          <>
            <label className="field"><span>頻度・目安</span><input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="例：毎朝 10分" /></label>
            <label className="field"><span>習慣の詳細</span><textarea value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="取り組む内容、目的、続けるための工夫など" /></label>
          </>
        )}
        {type === "goal" && (
          <>
            <label className="field"><span>期限</span><input type="date" value={detail} onChange={(e) => setDetail(e.target.value)} /></label>
            <label className="field"><span>目標の説明</span><textarea value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="どうなれば達成かを具体的に" /></label>
          </>
        )}
        {type === "feedback" && (
          <>
            <label className="field"><span>背景・原因</span><textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="なぜ起きたか、どんな場面だったか" /></label>
            <label className="field"><span>次に試すこと</span><textarea value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="具体的な行動を小さく書く" /></label>
          </>
        )}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>キャンセル</button><button className="primary-button" type="submit">{editing ? "変更を保存" : "保存する"}</button></div>
      </form>
    </div>
  );
}
