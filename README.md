# 📋 FlowBoard — a Notion-style task workspace

FlowBoard is a task manager inspired by **Notion**. It has a sidebar of pages, and each page shows the same tasks as a **Board**, a **Table** or a **Calendar**. Tasks have properties, tags and checklists, and open in a side panel. There's a **Ctrl + K** command palette for searching everything.

Everything is saved in your browser, so there's no account and no server.

**🔗 Live demo:** https://akrambgh1.github.io/kanban-board/

## ✨ Features

### Workspace
- 📄 **Multiple pages** in a sidebar, each with its own emoji icon, title, groups and tasks
- ⧉ Duplicate and delete pages
- 🔍 **Command palette (Ctrl / ⌘ + K)**: search every task and page, switch views and run actions
- 🌙 **Light and dark mode** that follows your system and can be toggled
- ⬇️⬆️ **Export and import** the whole workspace as a JSON backup

### Three views of the same data
- **▦ Board**: drag and drop with dnd-kit (mouse, touch and keyboard), plus a quick **"+ New"** at the bottom of every group
- **☰ Table**: edit names, status, priority and due date inline; click a column header to sort
- **🗓 Calendar**: a month grid, where you **drag a task onto a day** to reschedule it and click **+** on a day to add one

### Tasks
- **Side peek panel** (like Notion) to edit everything about a task
- Properties: **status, priority, due date, created and edited time**
- **Colored tags** that you add with Enter and remove with ×, with suggestions from tags you already use
- **Checklist** with a progress bar, also shown on the card (☑ 2/4)
- **Notes** for longer details
- Emoji icon per task
- **Undo** after deleting, plus duplicate

### Groups (columns)
- Add, rename (double-click), recolor (9 Notion colors) and delete groups
- Choose which group counts as **complete** for the page's progress bar

### Search and filters
- Live search across titles, notes and tags
- Filter by priority and by tag

## 🛠️ Tech Stack

| Part | Technology |
|------|------------|
| UI | React 18 (hooks, `useReducer`) |
| Drag and drop | [dnd-kit](https://dndkit.com/) for the board, HTML5 drag and drop for the calendar |
| Build tool | Vite |
| Styling | Plain CSS with custom properties (light and dark themes) |
| State | One reducer plus `localStorage` persistence |
| CI/CD | GitHub Actions to GitHub Pages |

## 🚀 Run Locally

```bash
git clone https://github.com/akrambgh1/kanban-board.git
cd kanban-board
npm install
npm run dev
```

Then open http://localhost:5173/kanban-board/

## 📂 Project Structure

```
src/
├── App.jsx                  # Layout, page header, filters, actions, palette items
├── store.js                 # Reducer, factories, demo data, persistence
├── constants.js             # Colors, priorities, views, emoji
├── utils.js                 # Dates, tag colors, filtering helpers
├── styles.css
├── hooks/
│   ├── useLocalStorage.js
│   └── useDismiss.js        # Close popovers on outside click or Esc
└── components/
    ├── Sidebar.jsx          # Pages list and workspace actions
    ├── BoardView.jsx        # Drag-and-drop board
    ├── Column.jsx           # A group: rename, color, quick add
    ├── TaskCard.jsx
    ├── TableView.jsx        # Sortable, inline-editable table
    ├── CalendarView.jsx     # Month grid with drag to reschedule
    ├── TaskPanel.jsx        # Side peek with every property
    ├── CommandPalette.jsx   # Ctrl+K search
    ├── EmojiPicker.jsx
    └── Tag.jsx
```

## 📚 What I Learned

- Modeling a nested workspace (pages → groups → tasks) with a single reducer
- Multi-container drag and drop with dnd-kit on one flat task list
- Showing the same data as a board, a table and a calendar
- Building accessible popovers, a command palette and keyboard shortcuts
- Undo with a toast, and JSON import/export with validation
- Deploying a Vite app automatically with GitHub Actions

## 📄 License

MIT. Free to use and modify.
