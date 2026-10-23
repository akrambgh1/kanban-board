import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PRIORITIES } from "../constants.js";
import { checklistStats, dueInfo } from "../utils.js";
import Tag from "./Tag.jsx";

export default function TaskCard({ task, onOpen, disabled = false, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: disabled || overlay,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const priority = PRIORITIES[task.priority] ?? PRIORITIES.medium;
  const due = dueInfo(task.due);
  const checklist = checklistStats(task);

  return (
    <article
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      className={`card ${isDragging ? "dragging" : ""} ${overlay ? "overlay" : ""}`}
      onClick={onOpen}
      {...attributes}
      {...listeners}
      onKeyDown={(e) => {
        if (e.key === "Enter") return onOpen?.();
        listeners?.onKeyDown?.(e); // keep dnd-kit keyboard dragging
      }}
      aria-label={`${task.title || "Untitled"}, ${priority.label} priority. Press Space to drag, Enter to open.`}
    >
      <h3 className="card-title">
        {task.icon && <span className="card-icon">{task.icon}</span>}
        {task.title || <span className="placeholder">Untitled</span>}
      </h3>
      {task.description && <p className="card-desc">{task.description}</p>}

      {task.tags.length > 0 && (
        <div className="tags">
          {task.tags.map((t) => <Tag key={t} name={t} />)}
        </div>
      )}

      <div className="card-meta">
        <span className="prio" style={{ "--c": priority.color }}>
          <span className="prio-dot" />
          {priority.label}
        </span>
        {due && (
          <span className={`due ${due.overdue ? "overdue" : ""} ${due.soon ? "soon" : ""}`}>📅 {due.label}</span>
        )}
        {checklist.total > 0 && (
          <span className={`check ${checklist.done === checklist.total ? "complete" : ""}`}>
            ☑ {checklist.done}/{checklist.total}
          </span>
        )}
      </div>
    </article>
  );
}
