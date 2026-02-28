// components/SignatureCanvas.js
// HTML5 Canvas signature pad for service log sign-outs
// Range Medical System V2

import { useRef, useState, useEffect, useCallback } from 'react';

const styles = {
  container: {
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#fff'
  },
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151'
  },
  clearBtn: {
    padding: '4px 10px',
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#6b7280',
    cursor: 'pointer'
  },
  canvas: {
    display: 'block',
    cursor: 'crosshair',
    touchAction: 'none'
  },
  hint: {
    padding: '6px 12px',
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'center',
    borderTop: '1px solid #f3f4f6'
  }
};

export default function SignatureCanvas({ onSignature, width = 400, height = 150, label = 'Patient Signature' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Set up high-DPI canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSignature(true);
  }, [getPos]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, getPos]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Export signature as data URL
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignature && onSignature(dataUrl);
    }
  }, [isDrawing, hasSignature, onSignature]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasSignature(false);
    onSignature && onSignature(null);
  }, [onSignature]);

  return (
    <div style={styles.container}>
      <div style={styles.label}>
        <span>{label}</span>
        {hasSignature && (
          <button type="button" onClick={clearSignature} style={styles.clearBtn}>
            Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {!hasSignature && (
        <div style={styles.hint}>Sign above using mouse or touch</div>
      )}
    </div>
  );
}
