import { useEffect, useReducer } from "react";
import { daysFromToday, newId } from "./utils.js";

const STORAGE_KEY = "flowboard:workspace:v2";

// ---------- factories ----------
export const makeColumn = (title, color = "gray", complete = false) => ({ id: newId(), title, color, complete });

export const makeColumns = () => [
  makeColumn("To Do", "blue"),
  makeColumn("In Progress", "orange"),
  makeColumn("Done", "green", true),
];

// Tasks in the "complete" group count toward progress (falls back to the last group)
export const completeColumnId = (page) =>
  (page.columns.find((c) => c.complete) ?? page.columns[page.columns.length - 1])?.id;

export function makeTask(fields = {}) {
  const now = Date.now();
  return {
    id: newId(),
    title: "",
    icon: "",
    status: "",
    priority: "medium",
    due: "",
    tags: [],
    description: "",
    checklist: [],
    createdAt: now,
    updatedAt: now,
    ...fields,
  };
}

export const makePage = (fields = {}) => ({
  id: newId(),
  title: "",
  icon: "📄",
  view: "board",
  columns: makeColumns(),
  tasks: [],
  ...fields,
});

export const makeChecklist = (items) =>
  items.map((text) => ({ id: newId(), text: text.replace(/^\[x\] /, ""), done: text.startsWith("[x] ") }));

// Copy a page with fresh ids so it never clashes with the original
export function clonePage(page) {
  const columnMap = {};
  const columns = page.columns.map((c) => {
    const id = newId();
    columnMap[c.id] = id;
    return { ...c, id };
  });
  const tasks = page.tasks.map((t) => ({
    ...t,
    id: newId(),
    status: columnMap[t.status] ?? columns[0].id,
    checklist: t.checklist.map((i) => ({ ...i, id: newId() })),
  }));
  return { ...page, id: newId(), title: `${page.title || "Untitled"} (copy)`, columns, tasks };
}

// ---------- demo content ----------
export function demoWorkspace() {
  const [backlog, todo, doing, done] = [
    makeColumn("Backlog", "gray"),
    makeColumn("To Do", "blue"),
    makeColumn("In Progress", "orange"),
    makeColumn("Done", "green", true),
  ];
  const launch = makePage({
    title: "Product Launch",
    icon: "🚀",
    columns: [backlog, todo, doing, done],
    tasks: [
      makeTask({
        title: "Design landing page", icon: "🎨", status: todo.id, priority: "high", due: daysFromToday(2),
        tags: ["Design", "Web"], description: "Wireframe first, then high-fidelity mockups.",
        checklist: makeChecklist(["[x] Hero section", "[x] Features grid", "Pricing table", "Mobile layout"]),
      }),
      makeTask({
        title: "Write launch blog post", icon: "📝", status: todo.id, priority: "medium", due: daysFromToday(5),
        tags: ["Marketing"], description: "Explain the problem, the solution and how to get started.",
      }),
      makeTask({ title: "Set up analytics", status: backlog.id, priority: "low", tags: ["Dev"] }),
      makeTask({
        title: "Customer interviews", icon: "💬", status: backlog.id, priority: "medium", due: daysFromToday(9),
        tags: ["Research"], checklist: makeChecklist(["Write questions", "Book 5 calls"]),
      }),
      makeTask({
        title: "Build drag and drop", icon: "🛠️", status: doing.id, priority: "high", due: daysFromToday(0),
        tags: ["Dev"], description: "Mouse, touch and keyboard support with dnd-kit.",
        checklist: makeChecklist(["[x] Mouse", "[x] Touch", "Keyboard"]),
      }),
      makeTask({
        title: "Email newsletter", status: doing.id, priority: "medium", due: daysFromToday(-1), tags: ["Marketing"],
      }),
      makeTask({ title: "Choose brand colors", status: done.id, priority: "low", due: daysFromToday(-4), tags: ["Design"] }),
      makeTask({
        title: "Deploy to GitHub Pages", icon: "🚀", status: done.id, priority: "medium", due: daysFromToday(-2),
        tags: ["Dev"], description: "Automatic deploy with GitHub Actions.",
      }),
    ],
  });

  const [pTodo, pDoing, pDone] = [makeColumn("To Do", "blue"), makeColumn("Doing", "purple"), makeColumn("Done", "green", true)];
  const personal = makePage({
    title: "Personal",
    icon: "🏠",
    columns: [pTodo, pDoing, pDone],
    tasks: [
      makeTask({
        title: "Gym 3x this week", icon: "🏋️", status: pTodo.id, tags: ["Health"],
        checklist: makeChecklist(["[x] Monday", "Wednesday", "Friday"]),
      }),
      makeTask({ title: "Plan weekend trip", icon: "✈️", status: pTodo.id, priority: "high", due: daysFromToday(3), tags: ["Travel"] }),
      makeTask({ title: "Pay internet bill", status: pTodo.id, priority: "high", due: daysFromToday(1), tags: ["Finance"] }),
      makeTask({ title: "Read “Atomic Habits”", icon: "📚", status: pDoing.id, priority: "low", due: daysFromToday(7), tags: ["Reading"] }),
      makeTask({ title: "Renew passport", status: pDone.id, priority: "medium", tags: ["Travel"] }),
    ],
  });

  return { version: 2, activePageId: launch.id, pages: [launch, personal] };
}

// ---------- reducer ----------
const updatePage = (state, pageId, fn) => ({
  ...state,
  pages: state.pages.map((p) => (p.id === pageId ? fn(p) : p)),
});

export function reducer(state, action) {
  switch (action.type) {
    case "page/add": {
      const page = action.page ?? makePage();
      return { ...state, pages: [...state.pages, page], activePageId: page.id };
    }
    case "page/update":
      return updatePage(state, action.pageId, (p) => ({ ...p, ...action.changes }));
    case "page/delete": {
      const pages = state.pages.filter((p) => p.id !== action.pageId);
      if (!pages.length) pages.push(makePage());
      const activePageId = state.activePageId === action.pageId ? pages[0].id : state.activePageId;
      return { ...state, pages, activePageId };
    }
    case "page/select":
      return { ...state, activePageId: action.pageId };

    case "column/add":
      return updatePage(state, action.pageId, (p) => ({ ...p, columns: [...p.columns, action.column] }));
    case "column/set-complete":
      return updatePage(state, action.pageId, (p) => ({
        ...p,
        columns: p.columns.map((c) => ({ ...c, complete: c.id === action.columnId })),
      }));
    case "column/update":
      return updatePage(state, action.pageId, (p) => ({
        ...p,
        columns: p.columns.map((c) => (c.id === action.columnId ? { ...c, ...action.changes } : c)),
      }));
    case "column/delete":
      return updatePage(state, action.pageId, (p) => {
        if (p.columns.length <= 1) return p;
        const columns = p.columns.filter((c) => c.id !== action.columnId);
        const fallback = columns[0].id;
        return {
          ...p,
          columns,
          tasks: p.tasks.map((t) => (t.status === action.columnId ? { ...t, status: fallback } : t)),
        };
      });

    case "task/add":
      return updatePage(state, action.pageId, (p) => ({
        ...p,
        tasks: action.atEnd ? [...p.tasks, action.task] : [action.task, ...p.tasks],
      }));
    case "task/update":
      return updatePage(state, action.pageId, (p) => ({
        ...p,
        tasks: p.tasks.map((t) =>
          t.id === action.taskId ? { ...t, ...action.changes, updatedAt: Date.now() } : t
        ),
      }));
    case "task/delete":
      return updatePage(state, action.pageId, (p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== action.taskId) }));
    case "task/restore":
      return updatePage(state, action.pageId, (p) => {
        const tasks = [...p.tasks];
        tasks.splice(Math.min(Math.max(action.index, 0), tasks.length), 0, action.task);
        return { ...p, tasks };
      });
    case "tasks/set":
      return updatePage(state, action.pageId, (p) => ({ ...p, tasks: action.tasks }));

    case "workspace/replace":
      return action.workspace;
    default:
      return state;
  }
}

// ---------- persistence ----------
export function isValidWorkspace(ws) {
  return (
    ws &&
    Array.isArray(ws.pages) &&
    ws.pages.length > 0 &&
    ws.pages.every((p) => p.id && Array.isArray(p.columns) && p.columns.length && Array.isArray(p.tasks))
  );
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const ws = JSON.parse(raw);
      if (isValidWorkspace(ws)) return ws;
    }
  } catch {
    /* storage blocked or corrupted: start fresh */
  }
  return demoWorkspace();
}

export function useWorkspace() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [state]);
  return [state, dispatch];
}
