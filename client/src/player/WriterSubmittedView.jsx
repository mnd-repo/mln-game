import React from 'react';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';

// Shown to a writer right after they submit, while other writers are still typing.
export default function WriterSubmittedView() {
  return (
    <Scene type="writer">
      <PaperCard attach="pin" pin="green" tilt={-0.4} centered>
        <h2 className="paper-title">Hồ sơ đã được gửi!</h2>
        <p className="hint">Đang đợi những ứng viên khác viết xong…</p>
      </PaperCard>
    </Scene>
  );
}
