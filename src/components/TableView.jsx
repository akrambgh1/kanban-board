import { useState } from "react";
import { COLORS, PRIORITIES } from "../constants.js";
import { checklistStats, dueInfo } from "../utils.js";
import Tag from "./Tag.jsx";

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export default function TableView({ columns, tasks, filtering, onUpdate, onOpen, onAdd }) {
  const [sort, setSort] = useState({ key: null, dir: 1 });

  const statusIndex = Object.fromEntries(columns.map((c, i) => [c.id, i]));
  const getters = {
    title: (t) => (t.title || "").toLowerCase(),
    status: (t) => statusIndex[t.status] ?? 99,
    priority: (t) => PRIORITY_RANK[t.priority] ?? 9,
    due: (t) => t.due || "9999-12-31",
  };

  const rows = sort.key
    ? [...tasks].sort((a, b) => {
        const x = getters[sort.key](a);
        const y = getters[sort.key](b);
        return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
      })
    : tasks;

  // Click once for ascending, twice for descending, three times to clear
  const toggleSort = (key) =>
    setSort((s) => (s.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : { key: null, dir: 1 }));

  const header = (key, label) => (
    <th>
      <button className={`th-btn ${sort.key === key ? "sorted" : ""}`} onClick={() => toggleSort(key)}>
        {label}
        {sort.key === key && <span>{sort.dir === 1 ? " ↑" : " ↓"}</span>}
      </button>
    </th>
  );

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {header("title", "Aa Name")}
            {header("status", "◉ Status")}
            {header("priority", "⚑ Priority")}
            {header("due", "📅 Due")}
            <th><span className="th-static">🏷 Tags</span></th>
            <th><span className="th-static">☑ Checklist</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const col = columns.find((c) => c.id === t.status);
            const check = checklistStats(t);
            const due = dueInfo(t.due);
            return (
              <tr key={t.id}>
                <td className="cell-title">
                  <span className="row-icon">{t.icon || "📄"}</span>
                  <input
                    className="cell-input"
                    value={t.title}
                    placeholder="Untitled"
                    onChange={(e) => onUpdate(t.id, { title: e.target.value })}
                    aria-label="Task name"
                  />
                  <button className="open-btn" onClick={() => onOpen(t)}>Open</button>
                </td>
                <td>
                  <select
                    className="pill-select"
                    style={{ "--c": COLORS[col?.color] ?? COLORS.gray }}
                    value={t.status}
                    onChange={(e) => onUpdate(t.id, { status: e.target.value })}
                    aria-label="Status"
                  >
                    {columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    className="pill-select"
                    style={{ "--c": PRIORITIES[t.priority]?.color }}
                    value={t.priority}
                    onChange={(e) => onUpdate(t.id, { priority: e.target.value })}
                    aria-label="Priority"
                  >
                    {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    className={`cell-date ${due?.overdue ? "overdue" : ""}`}
                    value={t.due}
                    onChange={(e) => onUpdate(t.id, { due: e.target.value })}
                    aria-label="Due date"
                  />
                </td>
                <td>
                  <div className="tags">{t.tags.map((tag) => <Tag key={tag} name={tag} />)}</div>
                </td>
                <td>
                  {check.total ? (
                    <span className="mini-progress">
                      <span className="bar"><span style={{ width: `${check.percent}%` }} /></span>
                      {check.done}/{check.total}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty table-empty">{filtering ? "No matching tasks" : "No tasks yet"}</div>}
      <button className="new-row" onClick={onAdd}>＋ New</button>
    </div>
  );
}
