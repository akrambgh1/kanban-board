import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Column from "./Column.jsx";
import TaskCard from "./TaskCard.jsx";
import { COLORS } from "../constants.js";
import { newId } from "../utils.js";

export default function BoardView({ page, tasks, filtering, completeId, dispatch, onOpen, onQuickAdd }) {
  const [activeId, setActiveId] = useState(null);
  const [newColumnId, setNewColumnId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // The page keeps one flat task list; a task's column is its `status`
  const all = page.tasks;
  const isColumn = (id) => page.columns.some((c) => c.id === id);
  const statusOf = (id) => (isColumn(id) ? id : all.find((t) => t.id === id)?.status);
  const setTasks = (next) => dispatch({ type: "tasks/set", pageId: page.id, tasks: next });

  // Move the card into another column while it is dragged over it
  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const task = all.find((t) => t.id === active.id);
    const target = statusOf(over.id);
    if (!task || !target || task.status === target) return;

    const next = all.filter((t) => t.id !== active.id);
    const moved = { ...task, status: target, updatedAt: Date.now() };
    const overIndex = next.findIndex((t) => t.id === over.id);
    if (overIndex >= 0) next.splice(overIndex, 0, moved);
    else next.push(moved);
    setTasks(next);
  };

  // Reorder inside the column when the card is dropped
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = all.findIndex((t) => t.id === active.id);
    const to = all.findIndex((t) => t.id === over.id);
    if (from < 0 || to < 0 || all[from].status !== all[to].status) return;
    setTasks(arrayMove(all, from, to));
  };

  const addColumn = () => {
    const used = new Set(page.columns.map((c) => c.color));
    const color = Object.keys(COLORS).find((c) => !used.has(c)) ?? "gray";
    const column = { id: newId(), title: "New group", color };
    dispatch({ type: "column/add", pageId: page.id, column });
    setNewColumnId(column.id);
  };

  const deleteColumn = (column) => {
    const count = all.filter((t) => t.status === column.id).length;
    const fallback = page.columns.find((c) => c.id !== column.id);
    const message = count
      ? `Delete group "${column.title}"? Its ${count} task(s) will move to "${fallback.title}".`
      : `Delete group "${column.title}"?`;
    if (window.confirm(message)) dispatch({ type: "column/delete", pageId: page.id, columnId: column.id });
  };

  const activeTask = all.find((t) => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="board">
        {page.columns.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.status === col.id)}
            count={all.filter((t) => t.status === col.id).length}
            complete={col.id === completeId}
            disabled={filtering}
            autoEdit={col.id === newColumnId}
            canDelete={page.columns.length > 1}
            onOpen={onOpen}
            onQuickAdd={(title) => onQuickAdd(col.id, title)}
            onChange={(changes) => dispatch({ type: "column/update", pageId: page.id, columnId: col.id, changes })}
            onSetComplete={() => dispatch({ type: "column/set-complete", pageId: page.id, columnId: col.id })}
            onDelete={() => deleteColumn(col)}
          />
        ))}
        <button className="add-group" onClick={addColumn}>＋ Add group</button>
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
