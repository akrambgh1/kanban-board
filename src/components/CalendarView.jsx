import { useState } from "react";
import { COLORS } from "../constants.js";
import { isoDate } from "../utils.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

export default function CalendarView({ columns, tasks, onOpen, onAdd, onMove }) {
  const [cursor, setCursor] = useState(() => firstOfMonth(new Date()));
  const [dropDay, setDropDay] = useState(null);

  // 6 weeks starting on the Sunday before the 1st
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - cursor.getDay());
  const days = Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );

  const byDay = {};
  for (const t of tasks) if (t.due) (byDay[t.due] ||= []).push(t);
  const undated = tasks.filter((t) => !t.due);
  const today = isoDate(new Date());
  const colorOf = (status) => COLORS[columns.find((c) => c.id === status)?.color] ?? COLORS.gray;
  const shift = (months) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + months, 1));

  const chip = (t) => (
    <button
      key={t.id}
      className="cal-chip"
      style={{ "--c": colorOf(t.status) }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", t.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onOpen(t)}
      title={t.title || "Untitled"}
    >
      {t.icon && <span className="cal-chip-icon">{t.icon}</span>}
      <span className="cal-chip-text">{t.title || "Untitled"}</span>
    </button>
  );

  return (
    <div className="calendar">
      <div className="cal-head">
        <h3>{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
        <div className="cal-nav">
          <button className="btn ghost sm" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <button className="btn ghost sm" onClick={() => setCursor(firstOfMonth(new Date()))}>Today</button>
          <button className="btn ghost sm" onClick={() => shift(1)} aria-label="Next month">›</button>
        </div>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
        {days.map((d) => {
          const iso = isoDate(d);
          const list = byDay[iso] ?? [];
          const outside = d.getMonth() !== cursor.getMonth();
          return (
            <div
              key={iso}
              className={`cal-day ${outside ? "outside" : ""} ${iso === today ? "today" : ""} ${dropDay === iso ? "drop" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDropDay(iso);
              }}
              onDragLeave={() => setDropDay((cur) => (cur === iso ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                setDropDay(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) onMove(id, iso);
              }}
            >
              <div className="cal-day-top">
                <span className="cal-num">{d.getDate()}</span>
                <button className="cal-add" onClick={() => onAdd(iso)} aria-label={`Add task on ${iso}`}>+</button>
              </div>
              <div className="cal-items">{list.map(chip)}</div>
            </div>
          );
        })}
      </div>

      {undated.length > 0 && (
        <div
          className={`undated ${dropDay === "none" ? "drop" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDropDay("none");
          }}
          onDragLeave={() => setDropDay(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDropDay(null);
            const id = e.dataTransfer.getData("text/plain");
            if (id) onMove(id, "");
          }}
        >
          <h4>No date · {undated.length}</h4>
          <div className="undated-list">{undated.map(chip)}</div>
        </div>
      )}
      <p className="hint">Drag a task onto a day to reschedule it. Click + on a day to add a task there.</p>
    </div>
  );
}
