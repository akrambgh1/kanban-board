// Notion-style color palette used for groups, tags and priorities
export const COLORS = {
  gray: "#9b9a97",
  brown: "#a27763",
  orange: "#d9730d",
  yellow: "#cb912f",
  green: "#448361",
  blue: "#337ea9",
  purple: "#9065b0",
  pink: "#c14c8a",
  red: "#d44c47",
};

export const PRIORITIES = {
  high: { label: "High", color: COLORS.red },
  medium: { label: "Medium", color: COLORS.yellow },
  low: { label: "Low", color: COLORS.green },
};

export const VIEWS = [
  { id: "board", label: "Board", icon: "▦" },
  { id: "table", label: "Table", icon: "☰" },
  { id: "calendar", label: "Calendar", icon: "🗓" },
];

export const EMOJI = [
  "📄", "📋", "🚀", "🎯", "💡", "📚", "🏠", "💼", "🎨", "🧪", "🛠️", "📈",
  "🗓️", "✅", "⭐", "🔥", "❤️", "🎉", "🌱", "☕", "🎵", "✈️", "🏋️", "🍎",
  "🧠", "💻", "📱", "🐛", "🔒", "📦", "🧾", "💬", "📝", "🔍", "⚡", "🌍",
  "🏆", "🎓", "🧩", "🪴", "🛒", "💰",
];
