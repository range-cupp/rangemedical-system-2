// components/EmojiPicker.js
// Lightweight emoji picker — no external dependencies
// Range Medical

import { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: '😊',
    emojis: [
      '😊', '😃', '😄', '😁', '😆', '🥹', '😅', '🤣', '😂', '🙂', '😉', '😌',
      '😍', '🥰', '😘', '😗', '😙', '😚', '🤗', '🤩', '🤔', '🤨', '😐', '😑',
      '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴',
      '😌', '😛', '😜', '🤪', '😝', '🤑', '🤭', '🫢', '🫣', '🤫', '🤥', '😬',
      '😮‍💨', '🤧', '😷', '🤒', '🤕', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎',
      '🤓', '🧐', '😤', '😡', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👻',
    ],
  },
  {
    name: 'Hands',
    icon: '👍',
    emojis: [
      '👍', '👎', '👌', '🤌', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '👇', '☝️', '🫵', '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳',
      '🫴', '👏', '🙌', '🫶', '🤝', '🙏', '✍️', '💪', '🦾', '🤳', '💅',
    ],
  },
  {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🩷', '🧡', '💛', '💚', '💙', '🩵', '💜', '🖤', '🩶', '🤍', '🤎',
      '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
      '♥️', '🫀', '💋', '💌',
    ],
  },
  {
    name: 'Common',
    icon: '⭐',
    emojis: [
      '⭐', '🌟', '✨', '💫', '🔥', '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇',
      '🏅', '🎯', '🚀', '💡', '📌', '📍', '✅', '❌', '⚡', '🌈', '☀️', '🌙',
      '⏰', '📱', '💻', '📞', '📧', '📝', '📋', '📆', '🗓️', '💊', '🩺', '🏥',
      '💉', '🧬', '🔬', '🩸', '💪', '🧘', '🏋️', '🏃', '🚶', '🧠', '❤️‍🩹', '🩻',
    ],
  },
];

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={pickerRef} style={styles.container}>
      <div style={styles.tabs}>
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveTab(i)}
            style={{
              ...styles.tab,
              ...(activeTab === i ? styles.tabActive : {}),
            }}
            title={cat.name}
          >
            {cat.icon}
          </button>
        ))}
      </div>
      <div style={styles.grid}>
        {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => onSelect(emoji)}
            style={styles.emojiBtn}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 6,
    width: 320,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 100,
    overflow: 'hidden',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #e2e8f0',
    padding: '4px 4px 0',
  },
  tab: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '6px 0 8px',
    fontSize: 18,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    opacity: 0.5,
  },
  tabActive: {
    opacity: 1,
    borderBottomColor: '#0f172a',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    padding: 6,
    maxHeight: 220,
    overflowY: 'auto',
  },
  emojiBtn: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    padding: 4,
    cursor: 'pointer',
    borderRadius: 4,
    lineHeight: 1.2,
  },
};
