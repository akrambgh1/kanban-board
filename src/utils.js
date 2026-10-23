import { COLORS } from "./constants.js";

export const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const pad = (n) => String(n).padStart(2, "0");

// "YYYY-MM-DD" in local time (toISOString would shift the day in some time zones)
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const daysFromToday = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
};

export function dueInfo(due) {
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${due}T00:00`);
  const days = Math.round((date - today) / 86400000);
  const label =
    days === 0 ? "Today" :
    days === 1 ? "Tomorrow" :
    days === -1 ? "Yesterday" :
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { label, overdue: days < 0, soon: days >= 0 && days <= 1 };
}

// The same tag name always gets the same color
export function tagColor(tag) {
  const names = Object.keys(COLORS);
  let hash = 0;
  for (const ch of tag) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[names[hash % names.length]];
}

export function matches(task, { search, priority, tag }) {
  if (priority !== "all" && task.priority !== priority) return false;
  if (tag !== "all" && !task.tags.includes(tag)) return false;
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    task.title.toLowerCase().includes(q) ||
    task.description.toLowerCase().includes(q) ||
    task.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export const formatDateTime = (ts) =>
  new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const checklistStats = (task) => {
  const total = task.checklist.length;
  const done = task.checklist.filter((i) => i.done).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
};
