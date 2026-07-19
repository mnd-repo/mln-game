import React from 'react';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

export default function ManagerWaitingView({ jobTitle }) {
  return (
    <Scene type="manager">
      <PaperCard attach="pin" pin="blue" tilt={-0.7} centered>
        <h2 className="paper-title">Round in progress</h2>
        <p className="job-desc">The candidate is writing a resume for:</p>
        <h3 className="job-title">{jobTitle}</h3>
        <p className="hint">You'll review their resume shortly…</p>
      </PaperCard>
    </Scene>
  );
}
