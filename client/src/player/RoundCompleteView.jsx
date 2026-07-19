import React from 'react';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';
import { usePlaySoundOnMount } from '../hooks/useSound.js';

// Deliberately does not show hire/automate — nothing is revealed until the
// final dashboard at the end of the game.
export default function RoundCompleteView() {
  usePlaySoundOnMount('round-complete');

  return (
    <Scene type="manager">
      <PaperCard attach="pin" pin="green" tilt={-0.3} centered>
        <h2 className="paper-title">Bỏ phiếu hoàn thành</h2>
        <p className="hint">Đã lưu hồ sơ. Vòng tiếp trong giây lát…</p>
      </PaperCard>
    </Scene>
  );
}
