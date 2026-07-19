import React from 'react';

const PINS = ['red', 'blue', 'yellow', 'green'];

/**
 * The core surface: a sheet of paper pinned or taped to the corkboard,
 * with two more sheets peeking out from behind it for depth.
 *
 * @param {'pin'|'tape'} attach - how it's stuck to the board
 * @param {'red'|'blue'|'yellow'|'green'} pin - pushpin color (attach="pin")
 * @param {number} tilt - rotation in degrees, alternate +/- for variety
 * @param {boolean} stack - show the stacked-papers depth effect (default true)
 */
export default function PaperCard({
  children,
  attach = 'pin',
  pin = 'red',
  tilt = -0.6,
  stack = true,
  centered = false,
  className = ''
}) {
  const pinColor = PINS.includes(pin) ? pin : 'red';
  return (
    <div
      className={`paper-card${centered ? ' centered' : ''}${!stack ? ' no-stack' : ''} ${className}`}
      style={{ '--tilt': `${tilt}deg` }}
    >
      {attach === 'tape' ? <span className="washi-tape" /> : <span className={`pushpin pin-${pinColor}`} />}
      {children}
    </div>
  );
}
