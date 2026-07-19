import React, { useState } from 'react';

// Maps a "scene type" to an optional custom background image.
// Drop a matching file into client/public/assets/backgrounds/ to override
// the procedural corkboard texture for that screen — see the README in
// that folder. If the file is missing, the <img> just fails to load and
// we hide it, leaving the CSS cork texture (always rendered on .scene)
// showing through. Nothing breaks either way.
const BACKGROUNDS = {
  lobby: '/assets/backgrounds/lobby.jpg',
  writer: '/assets/backgrounds/writer.jpg',
  manager: '/assets/backgrounds/manager.jpg'
};

export default function Scene({ type = 'neutral', wide = false, children, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = BACKGROUNDS[type];
  const showCustomImg = Boolean(src) && !imgFailed;

  return (
    <div className={`scene scene-${type} ${className}`}>
      {showCustomImg && (
        <img
          className="scene-custom-bg"
          src={src}
          alt=""
          aria-hidden="true"
          onError={() => setImgFailed(true)}
        />
      )}
      <div className={`scene-content${wide ? ' wide' : ''}`}>{children}</div>
    </div>
  );
}
