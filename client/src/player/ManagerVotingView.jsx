import React, { useState } from 'react';
import CountdownBar from '../CountdownBar.jsx';
import Scene from '../components/Scene.jsx';
import PaperCard from '../components/PaperCard.jsx';
import StampButton from '../components/StampButton.jsx';

export default function ManagerVotingView({ jobTitle, jobDescription, candidateResume, deadline, onVote }) {
  const [voted, setVoted] = useState(null);

  function handleVote(decision) {
    if (voted) return;
    setVoted(decision);
    onVote(decision);
  }

  return (
    <Scene type="manager">
      <PaperCard attach="pin" pin="blue" tilt={-0.4} centered stack={false}>
        <h3 className="job-title">{jobTitle}</h3>
        <p className="job-desc">{jobDescription}</p>
        <CountdownBar deadline={deadline} soundKey="manager-countdown" />
      </PaperCard>

      <PaperCard attach="tape" tilt={0.5}>
        <div className="resume-display">
          <h3>Hồ sơ của Ứng viên</h3>
          <p>{candidateResume}</p>
        </div>

        <p className="hand-note centered" style={{ textAlign: 'center' }}>
          Giữ việc, hay tự động hóa?
        </p>
        <div className="stamp-row">
          <StampButton
            label="Giữ việc"
            variant="hire"
            onClick={() => handleVote('hire')}
            disabled={Boolean(voted)}
            stamped={voted === 'hire'}
          />
          <StampButton
            label="Tự động hóa"
            variant="automate"
            onClick={() => handleVote('automate')}
            disabled={Boolean(voted)}
            stamped={voted === 'automate'}
          />
        </div>
        {voted && <p className="hint centered" style={{ textAlign: 'center' }}>Đã đóng dấu. Đang đợi phòng quản lý…</p>}
      </PaperCard>
    </Scene>
  );
}
