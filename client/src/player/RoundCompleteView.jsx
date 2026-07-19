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
        <h2 className="paper-title">Voting complete</h2>
        <p className="hint">Filed away. Next round starting soon…</p>
      </PaperCard>
    </Scene>
  );
}
