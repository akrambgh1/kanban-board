import { useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard.jsx";
import { COLORS } from "../constants.js";
import { useDismiss } from "../hooks/useDismiss.js";

export default function Column({
  column, tasks, count, complete, disabled, autoEdit, canDelete,
  onOpen, onQuickAdd, onChange, onSetComplete, onDelete,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, disabled });
  const [editing, setEditing] = useState(Boolean(autoEdit));
  const [title, setTitle] = useState(column.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const menuRef = useRef(null);
  useDismiss(menuRef, () => setMenuOpen(false), menuOpen);

  const startEdit = () => {
    setTitle(column.title);
    setEditing(true);
    setMenuOpen(false);
  };

  const commitTitle = () => {
    setEditing(false);
    const next = title.trim();
    if (next && next !== column.title) onChange({ title: next });
  };

  const submitDraft = (e) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return setAdding(false);
    onQuickAdd(name);
    setDraft("");
  };

  return (
    <section className={`column ${isOver ? "over" : ""}`} style={{ "--c": COLORS[column.color] ?? COLORS.gray }}>
      <header className="column-head">
        {editing ? (
          <input
            className="column-title-input"
            autoFocus
            value={title}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setTitle(column.title);
                setEditing(false);
              }
            }}
            aria-label="Group name"
          />
        ) : (
          <button className="column-pill" onDoubleClick={startEdit} title="Double-click to rename">
            <span className="dot" />
            {column.title}
          </button>
        )}
        <span className="count">{count}</span>
        {complete && <span className="complete-mark" title="Tasks in this group count as complete">✓</span>}

        <div className="column-actions" ref={menuRef}>
          <button className="ghost-icon" onClick={() => setMenuOpen((o) => !o)} aria-label={`${column.title} options`}>⋯</button>
          <button className="ghost-icon" onClick={() => setAdding(true)} disabled={disabled} aria-label={`Add task to ${column.title}`}>+</button>
          {menuOpen && (
            <div className="popover menu right">
              <button className="menu-item" onClick={startEdit}>✏️ Rename</button>
              <button
                className="menu-item"
                disabled={complete}
                onClick={() => {
                  onSetComplete();
                  setMenuOpen(false);
                }}
              >
                ✓ {complete ? "Counts as complete" : "Count as complete"}
              </button>
              <div className="menu-label">Color</div>
              <div className="swatches">
                {Object.entries(COLORS).map(([name, hex]) => (
                  <button
                    key={name}
                    className={`swatch ${column.color === name ? "active" : ""}`}
                    style={{ "--c": hex }}
                    title={name}
                    aria-label={`${name} color`}
                    onClick={() => {
                      onChange({ color: name });
                      setMenuOpen(false);
                    }}
                  />
                ))}
              </div>
              <button
                className="menu-item danger"
                disabled={!canDelete}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                🗑️ Delete group
              </button>
            </div>
          )}
        </div>
      </header>

      <SortableContext id={column.id} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="task-list">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} disabled={disabled} onOpen={() => onOpen(task)} />
          ))}
          {tasks.length === 0 && !adding && (
            <div className="empty">{disabled ? "No matching tasks" : "Drop tasks here"}</div>
          )}
        </div>
      </SortableContext>

      {adding ? (
        <form className="quick-add" onSubmit={submitDraft}>
          <input
            autoFocus
            value={draft}
            placeholder="Type a name, press Enter…"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => !draft.trim() && setAdding(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            aria-label={`New task in ${column.title}`}
          />
        </form>
      ) : (
        <button className="new-row" onClick={() => setAdding(true)} disabled={disabled}>＋ New</button>
      )}
    </section>
  );
}
