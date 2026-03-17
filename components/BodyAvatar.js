// components/BodyAvatar.js
// Interactive body figure for IV placement site selection
// Click on body zones to mark IV placement location (inspired by Epic's Avatar)

import { useState } from 'react';

// IV placement zones with SVG coordinates for front and back views
const ZONES = {
  front: [
    { id: 'scalp', label: 'Scalp', x: 150, y: 38, w: 40, h: 30 },
    { id: 'r_ext_jugular', label: 'R Ext Jugular', x: 120, y: 88, w: 28, h: 22 },
    { id: 'l_ext_jugular', label: 'L Ext Jugular', x: 192, y: 88, w: 28, h: 22 },
    { id: 'r_arm', label: 'R Upper Arm', x: 76, y: 148, w: 28, h: 50 },
    { id: 'l_arm', label: 'L Upper Arm', x: 236, y: 148, w: 28, h: 50 },
    { id: 'r_ac', label: 'R Antecubital', x: 72, y: 205, w: 30, h: 24 },
    { id: 'l_ac', label: 'L Antecubital', x: 238, y: 205, w: 30, h: 24 },
    { id: 'r_forearm', label: 'R Forearm', x: 60, y: 236, w: 28, h: 50 },
    { id: 'l_forearm', label: 'L Forearm', x: 252, y: 236, w: 28, h: 50 },
    { id: 'r_wrist', label: 'R Wrist', x: 50, y: 292, w: 24, h: 20 },
    { id: 'l_wrist', label: 'L Wrist', x: 266, y: 292, w: 24, h: 20 },
    { id: 'r_hand', label: 'R Hand', x: 40, y: 318, w: 28, h: 30 },
    { id: 'l_hand', label: 'L Hand', x: 272, y: 318, w: 28, h: 30 },
    { id: 'r_leg', label: 'R Leg', x: 126, y: 370, w: 28, h: 60 },
    { id: 'l_leg', label: 'L Leg', x: 186, y: 370, w: 28, h: 60 },
    { id: 'r_saphenous', label: 'R Saphenous', x: 134, y: 430, w: 22, h: 22 },
    { id: 'l_saphenous', label: 'L Saphenous', x: 184, y: 430, w: 22, h: 22 },
    { id: 'r_foot', label: 'R Foot', x: 122, y: 478, w: 28, h: 22 },
    { id: 'l_foot', label: 'L Foot', x: 190, y: 478, w: 28, h: 22 },
  ],
  back: [
    { id: 'scalp_back', label: 'Scalp', x: 150, y: 38, w: 40, h: 30 },
    { id: 'r_arm_back', label: 'R Upper Arm', x: 76, y: 148, w: 28, h: 50 },
    { id: 'l_arm_back', label: 'L Upper Arm', x: 236, y: 148, w: 28, h: 50 },
    { id: 'r_forearm_back', label: 'R Forearm', x: 60, y: 236, w: 28, h: 50 },
    { id: 'l_forearm_back', label: 'L Forearm', x: 252, y: 236, w: 28, h: 50 },
    { id: 'r_hand_back', label: 'R Hand', x: 40, y: 318, w: 28, h: 30 },
    { id: 'l_hand_back', label: 'L Hand', x: 272, y: 318, w: 28, h: 30 },
    { id: 'r_leg_back', label: 'R Leg', x: 126, y: 370, w: 28, h: 60 },
    { id: 'l_leg_back', label: 'L Leg', x: 186, y: 370, w: 28, h: 60 },
    { id: 'r_foot_back', label: 'R Foot', x: 122, y: 478, w: 28, h: 22 },
    { id: 'l_foot_back', label: 'L Foot', x: 190, y: 478, w: 28, h: 22 },
  ],
};

// Map zone IDs to location field values
const ZONE_TO_LOCATION = {
  scalp: 'Scalp', scalp_back: 'Scalp',
  r_ext_jugular: 'External Jugular', l_ext_jugular: 'External Jugular',
  r_arm: 'Arm', l_arm: 'Arm', r_arm_back: 'Arm', l_arm_back: 'Arm',
  r_ac: 'Antecubital', l_ac: 'Antecubital',
  r_forearm: 'Forearm', l_forearm: 'Forearm', r_forearm_back: 'Forearm', l_forearm_back: 'Forearm',
  r_wrist: 'Wrist', l_wrist: 'Wrist',
  r_hand: 'Hand', l_hand: 'Hand', r_hand_back: 'Hand', l_hand_back: 'Hand',
  r_leg: 'Leg', l_leg: 'Leg', r_leg_back: 'Leg', l_leg_back: 'Leg',
  r_saphenous: 'Saphenous', l_saphenous: 'Saphenous',
  r_foot: 'Foot', l_foot: 'Foot', r_foot_back: 'Foot', l_foot_back: 'Foot',
};

// Map zone IDs to side (for orientation auto-fill)
const ZONE_TO_SIDE = {
  scalp: null, scalp_back: null,
  r_ext_jugular: 'Right', l_ext_jugular: 'Left',
  r_arm: 'Right', l_arm: 'Left', r_arm_back: 'Right', l_arm_back: 'Left',
  r_ac: 'Right', l_ac: 'Left',
  r_forearm: 'Right', l_forearm: 'Left', r_forearm_back: 'Right', l_forearm_back: 'Left',
  r_wrist: 'Right', l_wrist: 'Left',
  r_hand: 'Right', l_hand: 'Left', r_hand_back: 'Right', l_hand_back: 'Left',
  r_leg: 'Right', l_leg: 'Left', r_leg_back: 'Right', l_leg_back: 'Left',
  r_saphenous: 'Right', l_saphenous: 'Left',
  r_foot: 'Right', l_foot: 'Left', r_foot_back: 'Right', l_foot_back: 'Left',
};

// Determine anterior/posterior from view
const VIEW_TO_ORIENTATION = { front: 'Anterior', back: 'Posterior' };

// IV icon SVG path
function IVIcon({ x, y, size = 20 }) {
  return (
    <g transform={`translate(${x - size/2}, ${y - size/2})`}>
      <circle cx={size/2} cy={size/2} r={size/2 + 2} fill="#fff" stroke="#059669" strokeWidth="2" />
      <circle cx={size/2} cy={size/2} r={size/2 - 1} fill="#059669" />
      {/* IV drip icon */}
      <rect x={size/2 - 2} y={4} width={4} height={size - 8} rx={1} fill="#fff" />
      <circle cx={size/2} cy={size/2 + 2} r={2.5} fill="#fff" />
    </g>
  );
}

// Human body outline SVG (front view)
function BodyOutlineFront() {
  return (
    <g fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinejoin="round">
      {/* Head */}
      <ellipse cx="170" cy="42" rx="24" ry="28" />
      {/* Neck */}
      <line x1="158" y1="70" x2="158" y2="85" />
      <line x1="182" y1="70" x2="182" y2="85" />
      {/* Shoulders */}
      <path d="M158,85 Q140,85 108,110" />
      <path d="M182,85 Q200,85 232,110" />
      {/* Torso */}
      <path d="M108,110 L100,195 L130,300 L130,310" />
      <path d="M232,110 L240,195 L210,300 L210,310" />
      {/* Left arm (viewer's right) */}
      <path d="M232,110 Q252,130 260,175 Q265,200 268,230 Q272,260 280,295 Q285,315 288,340" />
      <path d="M232,115 Q248,135 254,175 Q258,200 260,230 Q264,260 270,295 Q274,315 276,340" />
      {/* Right arm (viewer's left) */}
      <path d="M108,110 Q88,130 80,175 Q75,200 72,230 Q68,260 60,295 Q55,315 52,340" />
      <path d="M108,115 Q92,135 86,175 Q82,200 80,230 Q76,260 70,295 Q66,315 64,340" />
      {/* Hips / pelvis */}
      <path d="M130,310 Q150,325 170,320 Q190,325 210,310" />
      {/* Right leg (viewer's left) */}
      <path d="M130,310 Q128,350 132,390 Q134,420 136,460 Q137,480 135,500" />
      <path d="M170,320 Q162,340 158,380 Q155,420 154,460 Q153,480 155,500" />
      {/* Left leg (viewer's right) */}
      <path d="M170,320 Q178,340 182,380 Q185,420 186,460 Q187,480 185,500" />
      <path d="M210,310 Q212,350 208,390 Q206,420 204,460 Q203,480 205,500" />
      {/* Right foot */}
      <path d="M135,500 Q130,510 128,515 Q140,518 155,515 Q155,510 155,500" />
      {/* Left foot */}
      <path d="M185,500 Q185,510 185,515 Q200,518 212,515 Q210,510 205,500" />
    </g>
  );
}

// Human body outline SVG (back view)
function BodyOutlineBack() {
  return (
    <g fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinejoin="round">
      {/* Head */}
      <ellipse cx="170" cy="42" rx="24" ry="28" />
      {/* Neck */}
      <line x1="158" y1="70" x2="158" y2="85" />
      <line x1="182" y1="70" x2="182" y2="85" />
      {/* Shoulders */}
      <path d="M158,85 Q140,85 108,110" />
      <path d="M182,85 Q200,85 232,110" />
      {/* Torso - back has spine line */}
      <path d="M108,110 L100,195 L130,300 L130,310" />
      <path d="M232,110 L240,195 L210,300 L210,310" />
      <line x1="170" y1="85" x2="170" y2="310" stroke="#e2e8f0" strokeWidth="0.8" strokeDasharray="3,3" />
      {/* Arms */}
      <path d="M232,110 Q252,130 260,175 Q265,200 268,230 Q272,260 280,295 Q285,315 288,340" />
      <path d="M232,115 Q248,135 254,175 Q258,200 260,230 Q264,260 270,295 Q274,315 276,340" />
      <path d="M108,110 Q88,130 80,175 Q75,200 72,230 Q68,260 60,295 Q55,315 52,340" />
      <path d="M108,115 Q92,135 86,175 Q82,200 80,230 Q76,260 70,295 Q66,315 64,340" />
      {/* Hips */}
      <path d="M130,310 Q150,325 170,320 Q190,325 210,310" />
      {/* Legs */}
      <path d="M130,310 Q128,350 132,390 Q134,420 136,460 Q137,480 135,500" />
      <path d="M170,320 Q162,340 158,380 Q155,420 154,460 Q153,480 155,500" />
      <path d="M170,320 Q178,340 182,380 Q185,420 186,460 Q187,480 185,500" />
      <path d="M210,310 Q212,350 208,390 Q206,420 204,460 Q203,480 205,500" />
      {/* Feet */}
      <path d="M135,500 Q130,510 128,515 Q140,518 155,515 Q155,510 155,500" />
      <path d="M185,500 Q185,510 185,515 Q200,518 212,515 Q210,510 205,500" />
      {/* Shoulder blades */}
      <ellipse cx="145" cy="140" rx="18" ry="12" stroke="#e2e8f0" strokeWidth="0.8" fill="none" />
      <ellipse cx="195" cy="140" rx="18" ry="12" stroke="#e2e8f0" strokeWidth="0.8" fill="none" />
    </g>
  );
}

export default function BodyAvatar({ selectedZone, onSelectZone }) {
  const [view, setView] = useState('front');
  const [hoveredZone, setHoveredZone] = useState(null);
  const zones = ZONES[view];

  const handleZoneClick = (zone) => {
    const location = ZONE_TO_LOCATION[zone.id];
    const side = ZONE_TO_SIDE[zone.id];
    const orientation = VIEW_TO_ORIENTATION[view];
    onSelectZone({
      zoneId: zone.id,
      label: zone.label,
      location,
      side,
      orientation,
      view,
    });
  };

  return (
    <div style={avatarStyles.container}>
      {/* View toggle */}
      <div style={avatarStyles.viewToggle}>
        <button
          type="button"
          onClick={() => setView('front')}
          style={{
            ...avatarStyles.viewBtn,
            ...(view === 'front' ? avatarStyles.viewBtnActive : {}),
          }}
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setView('back')}
          style={{
            ...avatarStyles.viewBtn,
            ...(view === 'back' ? avatarStyles.viewBtnActive : {}),
          }}
        >
          Back
        </button>
      </div>

      <div style={avatarStyles.svgWrapper}>
        <svg viewBox="0 0 340 530" style={avatarStyles.svg}>
          {/* Body outline */}
          {view === 'front' ? <BodyOutlineFront /> : <BodyOutlineBack />}

          {/* Clickable zones */}
          {zones.map((zone) => {
            const isSelected = selectedZone === zone.id;
            const isHovered = hoveredZone === zone.id;
            return (
              <g key={zone.id}>
                <rect
                  x={zone.x - zone.w / 2}
                  y={zone.y - zone.h / 2}
                  width={zone.w}
                  height={zone.h}
                  rx={6}
                  fill={isSelected ? 'rgba(5, 150, 105, 0.15)' : isHovered ? 'rgba(5, 150, 105, 0.08)' : 'transparent'}
                  stroke={isSelected ? '#059669' : isHovered ? '#86efac' : 'transparent'}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  onClick={() => handleZoneClick(zone)}
                />
                {/* IV marker icon when selected */}
                {isSelected && <IVIcon x={zone.x} y={zone.y} size={18} />}
              </g>
            );
          })}

          {/* Labels on hover */}
          {hoveredZone && !zones.find(z => z.id === hoveredZone && selectedZone === z.id) && (
            (() => {
              const zone = zones.find(z => z.id === hoveredZone);
              if (!zone) return null;
              return (
                <g>
                  <rect
                    x={zone.x - zone.label.length * 3.5 - 6}
                    y={zone.y - zone.h / 2 - 22}
                    width={zone.label.length * 7 + 12}
                    height={18}
                    rx={4}
                    fill="rgba(17, 17, 17, 0.85)"
                  />
                  <text
                    x={zone.x}
                    y={zone.y - zone.h / 2 - 10}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="10"
                    fontFamily="inherit"
                    fontWeight="600"
                  >
                    {zone.label}
                  </text>
                </g>
              );
            })()
          )}
        </svg>

        {/* Selected location label */}
        {selectedZone && (
          <div style={avatarStyles.selectedLabel}>
            <span style={avatarStyles.selectedDot} />
            {zones.find(z => z.id === selectedZone)?.label ||
             ZONES.front.find(z => z.id === selectedZone)?.label ||
             ZONES.back.find(z => z.id === selectedZone)?.label ||
             'Selected'}
          </div>
        )}
      </div>

      {/* Side labels */}
      <div style={avatarStyles.sideLabels}>
        <span style={avatarStyles.sideLabel}>R</span>
        <span style={avatarStyles.sideLabelCenter}>{view === 'front' ? 'ANTERIOR' : 'POSTERIOR'}</span>
        <span style={avatarStyles.sideLabel}>L</span>
      </div>
    </div>
  );
}

// Export helpers for use by parent form
export { ZONE_TO_LOCATION, ZONE_TO_SIDE, VIEW_TO_ORIENTATION };

const avatarStyles = {
  container: {
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  viewToggle: {
    display: 'flex',
    gap: 0,
    borderRadius: 10,
    overflow: 'hidden',
    border: '1.5px solid #e2e8f0',
  },
  viewBtn: {
    padding: '6px 24px',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    background: '#fff',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  viewBtnActive: {
    background: '#059669',
    color: '#fff',
  },
  svgWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 280,
  },
  svg: {
    width: '100%',
    height: 'auto',
  },
  selectedLabel: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#fff',
    border: '1.5px solid #059669',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: '#059669',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#059669',
    display: 'inline-block',
  },
  sideLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 280,
    padding: '0 8px',
  },
  sideLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: '#9ca3af',
  },
  sideLabelCenter: {
    fontSize: 10,
    fontWeight: 700,
    color: '#cbd5e1',
    letterSpacing: 2,
  },
};
