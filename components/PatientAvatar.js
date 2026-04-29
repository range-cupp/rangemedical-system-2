// Reusable circular patient avatar.
// Renders the cropped face headshot from patients.profile_photo_url when available,
// otherwise falls back to initials (or a question mark for unknown patients).
//
// Usage:
//   <PatientAvatar patient={p} size={42} />
//   <PatientAvatar photoUrl={p.profile_photo_url} name={p.name} size={28} />

import { useState } from 'react';

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#06b6d4', '#6366f1', '#84cc16', '#f97316',
];

function colorFor(name) {
  if (!name) return '#94a3b8';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initialsFor(p, name) {
  if (p?.first_name || p?.last_name) {
    return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase() || '?';
  }
  const src = name || p?.name || '';
  const parts = src.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PatientAvatar({
  patient,
  photoUrl,
  name,
  size = 36,
  onClick,
  title,
  style: styleOverride,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const url = photoUrl || patient?.profile_photo_url || null;
  const displayName = name || patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();
  const initials = initialsFor(patient, displayName);
  const bg = colorFor(displayName);
  const fontSize = Math.max(10, Math.round(size * 0.38));

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    border: '1px solid rgba(0,0,0,0.06)',
    ...styleOverride,
  };

  if (url && !imgFailed) {
    return (
      <div
        onClick={onClick}
        title={title || displayName}
        style={{ ...baseStyle, background: '#f1f5f9' }}
      >
        <img
          src={url}
          alt={displayName}
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      title={title || displayName}
      style={{
        ...baseStyle,
        background: bg,
        color: '#fff',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}
