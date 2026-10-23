import { tagColor } from "../utils.js";

export default function Tag({ name, onRemove }) {
  return (
    <span className="tag" style={{ "--c": tagColor(name) }}>
      {name}
      {onRemove && (
        <button type="button" className="tag-x" onClick={onRemove} aria-label={`Remove tag ${name}`}>
          ×
        </button>
      )}
    </span>
  );
}
