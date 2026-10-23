import { useRef, useState } from "react";
import { useDismiss } from "../hooks/useDismiss.js";

function PageRow({ page, active, onSelect, onDuplicate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, () => setMenuOpen(false), menuOpen);

  return (
    <div className={`page-row ${active ? "active" : ""}`} ref={ref}>
      <button className="page-link" onClick={onSelect}>
        <span className="page-link-icon">{page.icon || "📄"}</span>
        <span className="page-link-title">{page.title || "Untitled"}</span>
        <span className="page-link-count">{page.tasks.length}</span>
      </button>
      <button className="ghost-icon row-more" onClick={() => setMenuOpen((o) => !o)} aria-label="Page options">
        ⋯
      </button>
      {menuOpen && (
        <div className="popover menu right">
          <button className="menu-item" onClick={() => { setMenuOpen(false); onDuplicate(); }}>⧉ Duplicate</button>
          <button className="menu-item danger" onClick={() => { setMenuOpen(false); onDelete(); }}>🗑️ Delete</button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  pages, activeId, open, theme,
  onClose, onSelect, onAddPage, onDuplicatePage, onDeletePage,
  onSearch, onToggleTheme, onExport, onImport, onReset,
}) {
  const fileRef = useRef(null);

  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Workspace">
        <div className="ws-head">
          <span className="ws-logo">F</span>
          <span className="ws-name">FlowBoard</span>
          <button className="ghost-icon sidebar-close" onClick={onClose} aria-label="Close sidebar">«</button>
        </div>

        <button className="side-item" onClick={onSearch}>
          <span>🔍</span> Search <kbd>Ctrl K</kbd>
        </button>
        <button className="side-item" onClick={onToggleTheme}>
          <span>{theme === "dark" ? "☀️" : "🌙"}</span> {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <div className="side-label">Pages</div>
        <nav className="page-list">
          {pages.map((p) => (
            <PageRow
              key={p.id}
              page={p}
              active={p.id === activeId}
              onSelect={() => onSelect(p.id)}
              onDuplicate={() => onDuplicatePage(p)}
              onDelete={() => onDeletePage(p)}
            />
          ))}
        </nav>
        <button className="side-item muted" onClick={onAddPage}>
          <span>＋</span> New page
        </button>

        <div className="side-footer">
          <button className="side-item muted" onClick={onExport}><span>⬇️</span> Export backup</button>
          <button className="side-item muted" onClick={() => fileRef.current?.click()}><span>⬆️</span> Import backup</button>
          <button className="side-item muted" onClick={onReset}><span>↺</span> Reset demo</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = "";
            }}
          />
        </div>
      </aside>
      {open && <div className="scrim" onClick={onClose} />}
    </>
  );
}
