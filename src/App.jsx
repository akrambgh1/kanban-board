import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BoardView from "./components/BoardView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import EmojiPicker from "./components/EmojiPicker.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TableView from "./components/TableView.jsx";
import TaskPanel from "./components/TaskPanel.jsx";
import { PRIORITIES, VIEWS } from "./constants.js";
import { useDismiss } from "./hooks/useDismiss.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import {
  clonePage, completeColumnId, demoWorkspace, isValidWorkspace, makePage, makeTask, useWorkspace,
} from "./store.js";
import { matches, newId } from "./utils.js";

const systemTheme = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const EMPTY_FILTERS = { search: "", priority: "all", tag: "all" };

export default function App() {
  const [ws, dispatch] = useWorkspace();
  const [theme, setTheme] = useLocalStorage("flowboard:theme", systemTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [toast, setToast] = useState(null);
  const iconRef = useRef(null);
  useDismiss(iconRef, () => setIconOpen(false), iconOpen);

  const page = ws.pages.find((p) => p.id === ws.activePageId) ?? ws.pages[0];
  const openTask = page.tasks.find((t) => t.id === openTaskId) ?? null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.title = `${page.icon} ${page.title || "Untitled"} · FlowBoard`;
  }, [page.icon, page.title]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // ---------- derived data ----------
  const allTags = useMemo(
    () => [...new Set(page.tasks.flatMap((t) => t.tags))].sort((a, b) => a.localeCompare(b)),
    [page.tasks]
  );
  const filtering = filters.search.trim() !== "" || filters.priority !== "all" || filters.tag !== "all";
  const visibleTasks = useMemo(() => page.tasks.filter((t) => matches(t, filters)), [page.tasks, filters]);
  const completeId = completeColumnId(page);
  const total = page.tasks.length;
  const completed = page.tasks.filter((t) => t.status === completeId).length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  // ---------- page actions ----------
  const updatePage = (changes) => dispatch({ type: "page/update", pageId: page.id, changes });

  const goToPage = (pageId) => {
    dispatch({ type: "page/select", pageId });
    setOpenTaskId(null);
    setFilters(EMPTY_FILTERS);
    setSidebarOpen(false);
  };

  const addPage = () => {
    dispatch({ type: "page/add", page: makePage() });
    setOpenTaskId(null);
    setFilters(EMPTY_FILTERS);
    setSidebarOpen(false);
  };

  const duplicatePage = (p) => {
    dispatch({ type: "page/add", page: clonePage(p) });
    setOpenTaskId(null);
    setFilters(EMPTY_FILTERS);
  };

  const deletePage = (p) => {
    const name = p.title || "Untitled";
    if (!window.confirm(`Delete page "${name}" and its ${p.tasks.length} task(s)?`)) return;
    dispatch({ type: "page/delete", pageId: p.id });
    setOpenTaskId(null);
  };

  // ---------- task actions ----------
  const addTask = (fields = {}, { atEnd = false, open = true } = {}) => {
    const task = makeTask({ status: page.columns[0].id, ...fields });
    dispatch({ type: "task/add", pageId: page.id, task, atEnd });
    if (open) setOpenTaskId(task.id);
  };

  const updateTask = (taskId, changes) => dispatch({ type: "task/update", pageId: page.id, taskId, changes });

  const deleteTask = (task) => {
    const pageId = page.id;
    const index = page.tasks.findIndex((t) => t.id === task.id);
    dispatch({ type: "task/delete", pageId, taskId: task.id });
    setOpenTaskId(null);
    setToast({
      message: `Deleted “${task.title || "Untitled"}”`,
      action: { label: "Undo", run: () => dispatch({ type: "task/restore", pageId, task, index }) },
    });
  };

  const duplicateTask = (task) => {
    const index = page.tasks.findIndex((t) => t.id === task.id);
    const now = Date.now();
    const copy = {
      ...task,
      id: newId(),
      title: `${task.title || "Untitled"} (copy)`,
      checklist: task.checklist.map((i) => ({ ...i, id: newId() })),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: "task/restore", pageId: page.id, task: copy, index: index + 1 });
    setOpenTaskId(copy.id);
  };

  const closePanel = useCallback(() => setOpenTaskId(null), []);

  // ---------- workspace actions ----------
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(ws, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!isValidWorkspace(data)) throw new Error("invalid");
      if (!window.confirm("Replace your whole workspace with this backup?")) return;
      const activePageId = data.pages.some((p) => p.id === data.activePageId) ? data.activePageId : data.pages[0].id;
      dispatch({ type: "workspace/replace", workspace: { ...data, activePageId } });
      setOpenTaskId(null);
      setFilters(EMPTY_FILTERS);
      setToast({ message: "Backup imported" });
    } catch {
      setToast({ message: "That file is not a FlowBoard backup" });
    }
  };

  const resetDemo = () => {
    if (!window.confirm("Replace your whole workspace with the demo pages?")) return;
    dispatch({ type: "workspace/replace", workspace: demoWorkspace() });
    setOpenTaskId(null);
    setFilters(EMPTY_FILTERS);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // ---------- command palette ----------
  const paletteItems = [
    { id: "a-task", group: "Actions", icon: "＋", label: "New task", hint: page.title, run: () => addTask() },
    { id: "a-page", group: "Actions", icon: "📄", label: "New page", run: addPage },
    ...VIEWS.map((v) => ({
      id: `a-view-${v.id}`, group: "Actions", icon: v.icon, label: `Switch to ${v.label} view`,
      run: () => updatePage({ view: v.id }),
    })),
    { id: "a-theme", group: "Actions", icon: theme === "dark" ? "☀️" : "🌙", label: "Toggle dark mode", run: toggleTheme },
    { id: "a-export", group: "Actions", icon: "⬇️", label: "Export backup", run: exportBackup },
    ...ws.pages.map((p) => ({
      id: `p-${p.id}`, group: "Pages", icon: p.icon || "📄", label: p.title || "Untitled",
      hint: `${p.tasks.length} tasks`, run: () => goToPage(p.id),
    })),
    ...ws.pages.flatMap((p) =>
      p.tasks.map((t) => ({
        id: `t-${t.id}`, group: "Tasks", icon: t.icon || "▫️", label: t.title || "Untitled",
        hint: `${p.icon} ${p.title || "Untitled"}`,
        run: () => {
          if (p.id !== page.id) goToPage(p.id);
          setOpenTaskId(t.id);
        },
      }))
    ),
  ];

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const openTaskHandler = (t) => setOpenTaskId(t.id);

  return (
    <div className="layout">
      <Sidebar
        pages={ws.pages}
        activeId={page.id}
        open={sidebarOpen}
        theme={theme}
        onClose={() => setSidebarOpen(false)}
        onSelect={goToPage}
        onAddPage={addPage}
        onDuplicatePage={duplicatePage}
        onDeletePage={deletePage}
        onSearch={() => { setSidebarOpen(false); setPaletteOpen(true); }}
        onToggleTheme={toggleTheme}
        onExport={exportBackup}
        onImport={importBackup}
        onReset={resetDemo}
      />

      <main className="main">
        <header className="topbar">
          <button className="ghost-icon menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">☰</button>
          <span className="crumb">{page.icon} {page.title || "Untitled"}</span>
          <span className="spacer" />
          <button className="ghost-icon" onClick={() => setPaletteOpen(true)} aria-label="Search (Ctrl+K)" title="Search (Ctrl+K)">🔍</button>
        </header>

        <div className="page">
          <div className="page-head">
            <div className="icon-wrap" ref={iconRef}>
              <button className="page-icon" onClick={() => setIconOpen((o) => !o)} aria-label="Change page icon">
                {page.icon || "📄"}
              </button>
              {iconOpen && (
                <EmojiPicker onPick={(icon) => { updatePage({ icon }); setIconOpen(false); }} />
              )}
            </div>
            <input
              className="page-title"
              value={page.title}
              placeholder="Untitled"
              onChange={(e) => updatePage({ title: e.target.value })}
              aria-label="Page title"
            />
            <div className="page-stats">
              <span>{total} tasks · {completed} complete · {progress}%</span>
              <div className="progress"><span style={{ width: `${progress}%` }} /></div>
            </div>
          </div>

          <div className="view-bar">
            <div className="tabs" role="tablist">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={page.view === v.id}
                  className={`tab ${page.view === v.id ? "active" : ""}`}
                  onClick={() => updatePage({ view: v.id })}
                >
                  <span>{v.icon}</span> {v.label}
                </button>
              ))}
            </div>
            <div className="view-tools">
              <input
                className="search"
                type="search"
                placeholder="Search…"
                value={filters.search}
                onChange={setFilter("search")}
                aria-label="Search tasks"
              />
              <select className="filter" value={filters.priority} onChange={setFilter("priority")} aria-label="Filter by priority">
                <option value="all">Any priority</option>
                {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
              </select>
              <select className="filter" value={filters.tag} onChange={setFilter("tag")} aria-label="Filter by tag">
                <option value="all">Any tag</option>
                {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {filtering && (
                <button className="btn ghost sm" onClick={() => setFilters(EMPTY_FILTERS)}>Clear</button>
              )}
              <button className="btn primary" onClick={() => addTask()}>New</button>
            </div>
          </div>

          {filtering && page.view === "board" && (
            <p className="hint">Showing {visibleTasks.length} of {total} tasks. Drag and drop is paused while filtering.</p>
          )}

          {page.view === "board" && (
            <BoardView
              page={page}
              tasks={visibleTasks}
              filtering={filtering}
              completeId={completeId}
              dispatch={dispatch}
              onOpen={openTaskHandler}
              onQuickAdd={(status, title) => addTask({ status, title }, { atEnd: true, open: false })}
            />
          )}
          {page.view === "table" && (
            <TableView
              columns={page.columns}
              tasks={visibleTasks}
              filtering={filtering}
              onUpdate={updateTask}
              onOpen={openTaskHandler}
              onAdd={() => addTask()}
            />
          )}
          {page.view === "calendar" && (
            <CalendarView
              columns={page.columns}
              tasks={visibleTasks}
              onOpen={openTaskHandler}
              onAdd={(due) => addTask({ due })}
              onMove={(taskId, due) => updateTask(taskId, { due })}
            />
          )}
        </div>
      </main>

      {openTask && (
        <TaskPanel
          key={openTask.id}
          task={openTask}
          columns={page.columns}
          allTags={allTags}
          onChange={(changes) => updateTask(openTask.id, changes)}
          onClose={closePanel}
          onDelete={() => deleteTask(openTask)}
          onDuplicate={() => duplicateTask(openTask)}
        />
      )}

      {paletteOpen && <CommandPalette items={paletteItems} onClose={() => setPaletteOpen(false)} />}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.action && (
            <button
              className="toast-action"
              onClick={() => {
                toast.action.run();
                setToast(null);
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button className="ghost-icon sm" onClick={() => setToast(null)} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}
