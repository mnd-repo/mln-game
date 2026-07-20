import React from 'react';
import CountdownBar from '../CountdownBar.jsx';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

// Shown to players who were not picked to write this game (or writers who are
// waiting for the phase to fully lock). Deliberately shows no job details, since
// several different jobs are being written at once.
export default function WritingPhaseWaitView({ deadline }) {
  return (
    <Scene type="manager">
      <PaperCard attach="pin" pin="blue" tilt={-0.7} centered>
        <h2 className="paper-title">Vòng viết hồ sơ</h2>
        <p className="job-desc">Các ứng viên đang viết hồ sơ.</p>
        {deadline && <CountdownBar deadline={deadline} />}
        <p className="hint">Sẽ có hồ sơ để chấm trong giây lát…</p>
      </PaperCard>
    </Scene>
  );
}
