import { useEffect, useRef, useState } from "react";
import { COLORS, PRIORITIES } from "../constants.js";
import { useDismiss } from "../hooks/useDismiss.js";
import { checklistStats, formatDateTime, newId } from "../utils.js";
import EmojiPicker from "./EmojiPicker.jsx";
import Tag from "./Tag.jsx";

// Notion-style "side peek" with every property of a task
export default function TaskPanel({ task, columns, allTags, onChange, onClose, onDelete, onDuplicate }) {
  const [iconOpen, setIconOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [itemDraft, setItemDraft] = useState("");
  const iconRef = useRef(null);
  useDismiss(iconRef, () => setIconOpen(false), iconOpen);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const status = columns.find((c) => c.id === task.status);
  const check = checklistStats(task);
  const tagSuggestions = allTags.filter((t) => !task.tags.includes(t));

  const addTag = (raw) => {
    const name = raw.trim().replace(/,$/, "");
    if (name && !task.tags.includes(name)) onChange({ tags: [...task.tags, name] });
    setTagDraft("");
  };

  const updateItem = (id, changes) =>
    onChange({ checklist: task.checklist.map((i) => (i.id === id ? { ...i, ...changes } : i)) });

  const addItem = (e) => {
    e.preventDefault();
    const text = itemDraft.trim();
    if (!text) return;
    onChange({ checklist: [...task.checklist, { id: newId(), text, done: false }] });
    setItemDraft("");
  };

  return (
    <>
      <div className="panel-scrim" onClick={onClose} />
      <aside className="panel" role="dialog" aria-label="Task details">
        <div className="panel-top">
          <button className="ghost-icon" onClick={onClose} aria-label="Close panel" title="Close (Esc)">⇥</button>
          <span className="spacer" />
          <button className="btn ghost sm" onClick={onDuplicate}>⧉ Duplicate</button>
          <button className="btn danger sm" onClick={onDelete}>🗑️ Delete</button>
        </div>

        <div className="panel-body">
          <div className="icon-wrap" ref={iconRef}>
            <button className={`task-icon ${task.icon ? "" : "empty"}`} onClick={() => setIconOpen((o) => !o)}>
              {task.icon || "☺ Add icon"}
            </button>
            {iconOpen && (
              <EmojiPicker
                onPick={(icon) => { onChange({ icon }); setIconOpen(false); }}
                onRemove={task.icon ? () => { onChange({ icon: "" }); setIconOpen(false); } : undefined}
              />
            )}
          </div>

          <input
            className="panel-title"
            value={task.title}
            placeholder="Untitled"
            autoFocus={!task.title}
            onChange={(e) => onChange({ title: e.target.value })}
            aria-label="Task name"
          />

          <div className="props">
            <div className="prop">
              <span className="prop-label">◉ Status</span>
              <select
                className="pill-select"
                style={{ "--c": COLORS[status?.color] ?? COLORS.gray }}
                value={task.status}
                onChange={(e) => onChange({ status: e.target.value })}
              >
                {columns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div className="prop">
              <span className="prop-label">⚑ Priority</span>
              <select
                className="pill-select"
                style={{ "--c": PRIORITIES[task.priority]?.color }}
                value={task.priority}
                onChange={(e) => onChange({ priority: e.target.value })}
              >
                {Object.entries(PRIORITIES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
              </select>
            </div>

            <div className="prop">
              <span className="prop-label">📅 Due date</span>
              <div className="prop-value">
                <input type="date" className="prop-input" value={task.due} onChange={(e) => onChange({ due: e.target.value })} />
                {task.due && <button className="ghost-icon sm" onClick={() => onChange({ due: "" })} aria-label="Clear due date">×</button>}
              </div>
            </div>

            <div className="prop">
              <span className="prop-label">🏷 Tags</span>
              <div className="prop-value tags-edit">
                {task.tags.map((t) => (
                  <Tag key={t} name={t} onRemove={() => onChange({ tags: task.tags.filter((x) => x !== t) })} />
                ))}
                <input
                  className="tag-input"
                  list="tag-suggestions"
                  value={tagDraft}
                  placeholder={task.tags.length ? "Add…" : "Add a tag and press Enter"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.endsWith(",")) addTag(v);
                    else setTagDraft(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addTag(tagDraft); }
                    if (e.key === "Backspace" && !tagDraft && task.tags.length) {
                      onChange({ tags: task.tags.slice(0, -1) });
                    }
                  }}
                  onBlur={() => tagDraft.trim() && addTag(tagDraft)}
                  aria-label="Add tag"
                />
                <datalist id="tag-suggestions">
                  {tagSuggestions.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>
            </div>

            <div className="prop">
              <span className="prop-label">🕒 Created</span>
              <span className="prop-text">{formatDateTime(task.createdAt)}</span>
            </div>
            <div className="prop">
              <span className="prop-label">✎ Edited</span>
              <span className="prop-text">{formatDateTime(task.updatedAt)}</span>
            </div>
          </div>

          <section className="panel-section">
            <div className="section-head">
              <h4>Checklist</h4>
              {check.total > 0 && <span className="muted">{check.done}/{check.total} · {check.percent}%</span>}
            </div>
            {check.total > 0 && (
              <div className="progress thin"><span style={{ width: `${check.percent}%` }} /></div>
            )}
            <ul className="checklist">
              {task.checklist.map((item) => (
                <li key={item.id} className={item.done ? "done" : ""}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) => updateItem(item.id, { done: e.target.checked })}
                    aria-label={`Mark "${item.text}" done`}
                  />
                  <input
                    className="check-text"
                    value={item.text}
                    onChange={(e) => updateItem(item.id, { text: e.target.value })}
                    aria-label="Checklist item"
                  />
                  <button
                    className="ghost-icon sm"
                    onClick={() => onChange({ checklist: task.checklist.filter((i) => i.id !== item.id) })}
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={addItem} className="check-add">
              <span>＋</span>
              <input value={itemDraft} onChange={(e) => setItemDraft(e.target.value)} placeholder="Add an item…" aria-label="New checklist item" />
            </form>
          </section>

          <section className="panel-section">
            <div className="section-head"><h4>Notes</h4></div>
            <textarea
              className="notes"
              value={task.description}
              placeholder="Write anything here: details, links, ideas…"
              rows={6}
              onChange={(e) => onChange({ description: e.target.value })}
              aria-label="Notes"
            />
          </section>
        </div>
      </aside>
    </>
  );
}
