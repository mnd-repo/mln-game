import React from 'react';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

export default function ManagerWaitingView({ jobTitle }) {
  return (
    <Scene type="manager">
      <PaperCard attach="pin" pin="blue" tilt={-0.7} centered>
        <h2 className="paper-title">Đang trong vòng</h2>
        <p className="job-desc">Ứng viên đang viết hồ sơ cho vị trí việc:</p>
        <h3 className="job-title">{jobTitle}</h3>
        <p className="hint">Sẽ có hồ sơ trong giây lát…</p>
      </PaperCard>
    </Scene>
  );
}
