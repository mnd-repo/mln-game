import React, { useEffect, useRef, useState } from 'react';
import { usePlaySoundOnMount } from './hooks/useSound.js';

// Server-driven countdown, rendered as a desk clock pinned to the board.
// Never runs its own independent timer logic — always derives from
// (deadline - now), so it can't drift from other clients.
//
// `soundKey` ('writer-countdown' | 'manager-countdown') plays once when
// this clock mounts — see client/public/assets/sounds/README.md.
export default function CountdownBar({ deadline, soundKey, soundActive = true }) {
  const [now, setNow] = useState(Date.now());
  const totalMsRef = useRef(null);

  if (totalMsRef.current === null) {
    totalMsRef.current = Math.max(1000, deadline - Date.now());
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  usePlaySoundOnMount(soundKey, { active: soundActive && Boolean(soundKey) });

  const remainingMs = Math.max(0, deadline - now);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, Math.max(0, remainingMs / totalMsRef.current));
  const urgent = remainingSec <= 10;

  // Sweep hand: 12 o'clock at full time remaining, travels clockwise to
  // 12 o'clock again as time drains (i.e. angle grows as progress shrinks).
  const angle = (1 - progress) * 360;
  const rad = ((angle - 90) * Math.PI) / 180;
  const handLen = 34;
  const cx = 50;
  const cy = 50;
  const hx = cx + handLen * Math.cos(rad);
  const hy = cy + handLen * Math.sin(rad);

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const outer = 44;
    const inner = i % 3 === 0 ? 37 : 40;
    return {
      x1: cx + outer * Math.sin(a),
      y1: cy - outer * Math.cos(a),
      x2: cx + inner * Math.sin(a),
      y2: cy - inner * Math.cos(a)
    };
  });

  return (
    <div className="desk-clock-wrap">
      <div className={`desk-clock${urgent ? ' urgent' : ''}`}>
        <div className="clock-bell" />
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="47" fill="#e9e2d0" stroke="#3a2f22" strokeWidth="3" />
          <circle className="clock-face" cx="50" cy="50" r="43" fill="#fbf6ea" />
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#4a3524"
              strokeWidth={i % 3 === 0 ? 2.4 : 1.4}
              strokeLinecap="round"
            />
          ))}
          <line
            x1={cx}
            y1={cy}
            x2={hx}
            y2={hy}
            stroke={urgent ? '#a33b2e' : '#2b241c'}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="3.4" fill={urgent ? '#a33b2e' : '#2b241c'} />
        </svg>
      </div>
      <div className={`desk-clock-seconds${urgent ? ' urgent' : ''}`}>{remainingSec}s</div>
    </div>
  );
}
