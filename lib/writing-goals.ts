const GOALS_KEY = 'shothik_writing_goals';

export interface StreakData {
  lastWriteDate: string;
  currentStreak: number;
  bestStreak: number;
}

export interface WritingSession {
  date: string;
  wordsWritten: number;
}

export interface WritingGoals {
  dailyGoalWords: number;
  streakData: StreakData;
  sessions: WritingSession[];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const DEFAULT_GOALS: WritingGoals = {
  dailyGoalWords: 500,
  streakData: { lastWriteDate: '', currentStreak: 0, bestStreak: 0 },
  sessions: [],
};

export function getGoals(): WritingGoals {
  if (typeof window === 'undefined') return DEFAULT_GOALS;
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return { ...DEFAULT_GOALS };
    return { ...DEFAULT_GOALS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_GOALS };
  }
}

function saveGoals(goals: WritingGoals) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

export function setDailyGoal(words: number) {
  const goals = getGoals();
  goals.dailyGoalWords = Math.max(1, words);
  saveGoals(goals);
}

export function getTodayWords(): number {
  const goals = getGoals();
  const today = todayStr();
  const session = goals.sessions.find(s => s.date === today);
  return session?.wordsWritten ?? 0;
}

export function recordSession(wordsWritten: number): boolean {
  const goals = getGoals();
  const today = todayStr();
  const yesterday = yesterdayStr();

  const idx = goals.sessions.findIndex(s => s.date === today);
  if (idx >= 0) {
    if (wordsWritten <= goals.sessions[idx].wordsWritten) {
      return false;
    }
    goals.sessions[idx].wordsWritten = wordsWritten;
  } else {
    goals.sessions.push({ date: today, wordsWritten });
    goals.sessions = goals.sessions.slice(-60);
  }

  const { lastWriteDate, currentStreak, bestStreak } = goals.streakData;
  let newStreak = currentStreak;
  if (lastWriteDate === today) {
    newStreak = currentStreak;
  } else if (lastWriteDate === yesterday) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }

  goals.streakData = {
    lastWriteDate: today,
    currentStreak: newStreak,
    bestStreak: Math.max(bestStreak, newStreak),
  };

  saveGoals(goals);

  const previousWords = idx >= 0 ? 0 : getTodayWords();
  const justCrossedGoal =
    previousWords < goals.dailyGoalWords &&
    wordsWritten >= goals.dailyGoalWords;
  return justCrossedGoal;
}

export function getStreakStatus(): StreakData {
  return getGoals().streakData;
}
