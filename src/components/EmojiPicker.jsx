import { EMOJI } from "../constants.js";

export default function EmojiPicker({ onPick, onRemove, align = "left" }) {
  return (
    <div className={`popover emoji-picker ${align}`}>
      <div className="emoji-grid">
        {EMOJI.map((e) => (
          <button key={e} type="button" className="emoji" onClick={() => onPick(e)}>
            {e}
          </button>
        ))}
      </div>
      {onRemove && (
        <button type="button" className="menu-item" onClick={onRemove}>
          Remove icon
        </button>
      )}
    </div>
  );
}
